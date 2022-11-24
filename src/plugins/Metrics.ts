// create a new plugin to add to the pipeline
// this plugin checks the
import { Plugin } from "@envelop/core"

let eCount = 0;
let sCount = 0;

export const metricsPlugin: Plugin = {
    onExecute({ args }) {
        const start = Date.now();
        return {
            onExecuteDone({result}) {
                //log metrics
                const end = Date.now()
                const duration = end - start
                console.info(`Query took ${duration} ms`)

                // errors are not counted as a response    
                if(result.hasOwnProperty('errors')) {
                    eCount++;
                    console.info(`Query returned ${result.errors.length} errors`)
                }else {
                    sCount++;
                    console.info(`Query returned no errors`)
                }
                // ratio of successful queries to errors
                console.info(`Successful queries: ${sCount}, Errors: ${eCount}, Ratio: ${eCount/(sCount+eCount)}`)
            },
        }
    }
}
