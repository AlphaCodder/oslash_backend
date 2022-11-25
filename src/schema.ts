import SchemaBuilder from '@pothos/core';
import { GraphQLError } from 'graphql'
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { APP_SECRET, decodeAuthHeader } from './utils/auth';
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

type AuthToken = {
    token: string;
}

type Stats = {
    operation: string;
    sucess: boolean;
    resTime: number;
}

type Metrics = {
    SuccessRate: number;
    FailureRate: number;
    AverageResponseTime: number;
}

type ShortcutItem = {
    id: number;
    title: string;
    url: string;
}

type User = {
    id: number;
    email: string;
    password: string;
    shortcuts?: ShortcutItem[];
}

const builder = new SchemaBuilder<{
    Objects: {
        User: User;
        ShortcutItem: ShortcutItem;
        AuthToken: AuthToken;
        Stats: Stats;
        Metrics: Metrics;
    },
}>({
});

builder.objectType('AuthToken', {
    fields: t => ({
        token: t.exposeString('token'),
    }),
});

builder.objectType('Stats', {
    fields: t => ({
        operation: t.exposeString('operation'),
        sucess: t.exposeBoolean('sucess'),
        resTime: t.exposeInt('resTime'),
    }),
})

builder.objectType('Metrics', {
    fields: t => ({
        SuccessRate: t.exposeFloat('SuccessRate'),
        FailureRate: t.exposeFloat('FailureRate'),
        AverageResponseTime: t.exposeFloat('AverageResponseTime'),
    }),
})

builder.objectType("ShortcutItem", {
    fields: t => ({
        id: t.exposeID("id"),
        title: t.exposeString("title"),
        url: t.exposeString("url"),
    })
});


builder.objectType("User", {
    fields: t => ({
        id: t.exposeID("id"),
        email: t.exposeString("email"),
        password: t.exposeString("password"),
        shortcuts: t.field({
            type: ["ShortcutItem"],
            resolve: async (user) => {
                return await prisma.shortcutItem.findMany({
                    where: {
                        userId: user.id
                    }
                })
            }
        })
    })
});

builder.queryType({
    fields: t => ({
        users: t.field({
            type: ["User"],
            resolve: () => prisma.user.findMany(),
        }),
        getUrl: t.field({
            type: "ShortcutItem",
            args: {
                title: t.arg.string({
                    required: true,
                }),
            },
            resolve: async (root, args, contextValue) => {
                const { userId } = contextValue.req;
                if (!userId) {
                    throw new GraphQLError('Not authenticated')
                }
                const shortcutItem = await prisma.shortcutItem.findFirst({
                    where: {
                        userId: userId,
                        title: args.title
                    }
                })
                if (!shortcutItem) {
                    throw new GraphQLError('Shortcut not found')
                }
                return shortcutItem;
            }

        }),
        getMyShortcuts: t.field({
            type: ["ShortcutItem"],
            resolve: async (parent, args, context) => {
                const userId = context.req.userId
                if (!userId) {
                    throw new GraphQLError("Not authenticated")
                }
                return await prisma.shortcutItem.findMany({
                    where: {
                        userId: userId
                    }
                })
            }
        }),
        getMetrics: t.field({
            type: ["Metrics"],
            args: {
                operation: t.arg.string({
                    required: true,
                }),
            },
            resolve: async (parent, args, context) => {
                const opCode = args.operation;
                const successCount = await prisma.stats.count({
                    where: {
                        operation: opCode,
                        success: true
                    }
                })
                const failureCount = await prisma.stats.count({
                    where: {
                        operation: opCode,
                        success: false
                    }
                })
                const totalCount = await prisma.stats.count({
                    where: {
                        operation: opCode,
                    }
                })
                const aggregations = await prisma.stats.aggregate({
                    _avg: {
                      resTime: true,
                    },
                  })
                return [{
                    SuccessRate: (successCount / totalCount) * 100,
                    FailureRate: (failureCount / totalCount) * 100,
                    AverageResponseTime: aggregations._avg.resTime
                }]
            }
        }),
    }),
});

// Mutations on the schema
builder.mutationType({
    fields: t => ({
        signup: t.field({
            type: "AuthToken",
            args: {
                email: t.arg.string({
                    required: true,
                }),
                password: t.arg.string({
                    required: true,
                }),
            },
            resolve: async (parent, args) => {
                // check if user already exists
                const userExists = await prisma.user.findFirst({
                    where: {
                        email: args.email
                    }
                })
                if (userExists) {
                    throw new GraphQLError('User already exists')
                }
                const password = await bcrypt.hash(args.password, 10)
                const user = await prisma.user.create({
                    data: {
                        email: args.email,
                        password: password
                    }
                })
                return {
                    token: jwt.sign({ userId: user.id }, APP_SECRET)
                }
            }
        }),
        login: t.field({
            type: "AuthToken",
            args: {
                email: t.arg.string({
                    required: true,
                }),
                password: t.arg.string({
                    required: true,
                }),
            },

            resolve: async (parent, args) => {
                const user = await prisma.user.findFirst({
                    where: {
                        email: args.email
                    }
                })
                if (!user) {
                    throw new GraphQLError('No such user found')
                }

                const valid = await bcrypt.compare(args.password, user.password)
                if (!valid) {
                    throw new GraphQLError('Invalid password')
                }

                return {
                    token: jwt.sign({ userId: user.id }, APP_SECRET)
                }
            },
        }),

        // create shortcut to user
        addShortcut: t.field({
            type: "ShortcutItem",
            args: {
                title: t.arg.string({
                    required: true,
                }),
                url: t.arg.string({
                    required: true,
                }),
            },
            resolve: async (parent, args, contextValue) => {
                const user = await prisma.user.findUnique({
                    where: {
                        id: contextValue.req.userId,
                    }
                })
                if (!user) {
                    throw new GraphQLError("User not found")
                }
                // check if shortcut already exists
                const shortcutIsPresent = await prisma.shortcutItem.findFirst({
                    where: {
                        title: args.title,
                        userId: user.id
                    }
                })
                if (shortcutIsPresent) {
                    throw new GraphQLError("Shortcut already exists")
                }

                return await prisma.shortcutItem.create({
                    data: {
                        title: args.title,
                        url: args.url,
                        user: {
                            connect: {
                                id: user.id
                            }
                        }
                    }
                })
            }
        }),
        // remove shortcut from user
        removeShortcut: t.field({
            type: "ShortcutItem",
            args: {
                title: t.arg.string({
                    required: true,
                }),
            },
            resolve: async (parent, args, contextValue) => {
                const user = await prisma.user.findUnique({
                    where: {
                        id: contextValue.req.userId,
                    }
                })
                if (!user) {
                    throw new GraphQLError("User not found")
                }
                // check if shortcut already exists
                const shortcutIsPresent = await prisma.shortcutItem.findFirst({
                    where: {
                        title: args.title
                    }
                })
                if (!shortcutIsPresent) {
                    throw new GraphQLError("Shortcut not found")
                }

                return await prisma.shortcutItem.delete({
                    where: {
                        id: shortcutIsPresent.id
                    },
                })
            }
        }),
        // update shortcut from user
        updateShortcut: t.field({
            type: "ShortcutItem",
            args: {
                title: t.arg.string({
                    required: true,
                }),
                url: t.arg.string({
                    required: true,
                }),
            },
            resolve: async (parent, args, contextValue) => {
                const user = await prisma.user.findUnique({
                    where: {
                        id: contextValue.req.userId,
                    }
                })
                if (!user) {
                    throw new GraphQLError("User not found")
                }
                // check if shortcut already exists
                const shortcutIsPresent = await prisma.shortcutItem.findFirst({
                    where: {
                        title: args.title
                    }
                })
                if (!shortcutIsPresent) {
                    throw new GraphQLError("Shortcut not found")
                }

                return await prisma.shortcutItem.update({
                    where: {
                        id: shortcutIsPresent.id
                    },
                    data: {
                        url: args.url
                    }
                })
            }
        }),
    })
});


export const schema = builder.toSchema()
export { AuthToken }