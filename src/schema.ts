import SchemaBuilder from '@pothos/core';
import SimpleObjectsPlugin from '@pothos/plugin-simple-objects';
import { GraphQLError } from 'graphql'
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { APP_SECRET, decodeAuthHeader } from './utils/auth';
import { PrismaClient } from '@prisma/client'
import { authPlugin } from './plugins/Auth';
const prisma = new PrismaClient()

type AuthToken = {
    token : string;
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
    },
}>({
    plugins: [SimpleObjectsPlugin],
});

builder.objectType('AuthToken', {
    fields: t => ({
        token: t.exposeString('token'),
    }),
});

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
            type: "String",
            args: {
                email: t.arg.string({
                    required: true,
                }),
                title: t.arg.string({
                    required: true,
                }),
            },
            resolve: async (parent, args) => {
                const user = await prisma.user.findUnique({
                    where: {
                        email: args.email
                    }
                })
                if (!user) {
                    throw new GraphQLError("User not found")
                }
                // check if shortcut already exists
                const shortcutIsPresent = await prisma.shortcutItem.findFirstOrThrow({
                    where: {
                        title: args.title,
                        userId: user.id
                    }
                })
                if (!shortcutIsPresent) {
                    throw new GraphQLError("Shortcut not found")
                }
                return shortcutIsPresent.url
                
                
            }
        })
    })
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
                const password = await bcrypt.hash(args.password, 10);
                const user = await prisma.user.create({
                    data: {
                        email: args.email,
                        password: password
                    }
                })
                const token = jwt.sign({ userId: user.id }, APP_SECRET);
                return {
                    token
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
                const user = await prisma.user.findUnique({
                    where: {
                        email: args.email
                    }
                })
                if (!user) {
                    throw new GraphQLError("User not found")
                }
                const passwordValid = await bcrypt.compare(args.password, user.password);
                if (!passwordValid) {
                    throw new GraphQLError("Invalid password")
                }
                const token = jwt.sign({ userId: user.id }, APP_SECRET);
                return {
                    token
                }
            },
        }),
        
        // create shortcut to user
        addShortcut: t.field({
            type: "ShortcutItem",
            args: {
                email: t.arg.string({
                    required: true,
                }),
                title: t.arg.string({
                    required: true,
                }),
                url: t.arg.string({
                    required: true,
                }),
            },
            resolve: async (parent, args) => {
                const user = await prisma.user.findUnique({
                    where: {
                        email: args.email
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
                email: t.arg.string({
                    required: true,
                }),
                title: t.arg.string({
                    required: true,
                }),
            },
            resolve: async (parent, args) => {
                const user = await prisma.user.findUnique({
                    where: {
                        email: args.email
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
                email: t.arg.string({
                    required: true,
                }),
                title: t.arg.string({
                    required: true,
                }),
                url: t.arg.string({
                    required: true,
                }),
            },
            resolve: async (parent, args) => {
                const user = await prisma.user.findUnique({
                    where: {
                        email: args.email
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