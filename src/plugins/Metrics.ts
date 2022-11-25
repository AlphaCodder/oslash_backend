// create a new plugin to add to the pipeline
// this plugin checks the
import { Plugin } from "@envelop/core"
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

const createStat = async (operation: string, success: boolean, resTime: number) => {
    await prisma.stats.create({
        data: {
            operation,
            success,
            resTime
        }
    })
}

export const metricsPlugin: Plugin = {
    onExecute({ args: { operationName, contextValue } }) {
        // skip if operation name is not in the list
        if (!["addShortcut", "removeShortcut", "updateShortcut", "getUrl"].includes(operationName)) {
            return
        }
        const start = Date.now();
        return {
            onExecuteDone({result}) {
                //log metrics
                const end = Date.now()
                const duration = end - start
                const status = result.hasOwnProperty('errors') ? false : true
            
                const stats = createStat(operationName, status, duration)
                console.info(`Operation ${operationName} ${status} took ${duration} ms`)
            },
        }
    }
}
