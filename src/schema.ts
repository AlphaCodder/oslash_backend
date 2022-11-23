import SchemaBuilder from '@pothos/core';
import SimpleObjectsPlugin from '@pothos/plugin-simple-objects';
import { GraphQLError } from 'graphql'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

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
    },
}>({
    plugins: [SimpleObjectsPlugin],
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
        // add user
        addUser: t.field({
            type: "User",
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
                const userIsPresent = await prisma.user.findFirst({
                    where: {
                        email: args.email
                    }
                })
                if (userIsPresent) {
                    throw new GraphQLError("User already exists")
                }
                const user = await prisma.user.create({
                    data: {
                        email: args.email,
                        password: args.password
                    }
                })
                return user
            }
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
                    }
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
