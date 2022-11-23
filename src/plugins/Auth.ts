import { envelop, Plugin } from '@envelop/core'
import { GraphQLError } from 'graphql'

const authPlugin: Plugin = {
    onParse({ params }) {
        console.log('Parse started!')

        return result => {
            console.log('Parse done!')
        }
    },
    // get the authorization header from the request
    onExecute({ args: { contextValue }, setResultAndStopExecution }) {
        // authenticate the user login here get the token fromt the login and use it to authenticate the user
        // if the user is not authenticated throw an error
        const token = contextValue.req.headers.authorization    
        if (!token) {
            setResultAndStopExecution(new GraphQLError('Not authenticated'))
        }
        // if the user is authenticated set the CurrentLoggedInUser to the user id
        console.log(token)


    }
}

// export const getEnveloped = envelop({
//     plugins: [
//         // ... other plugins
//         myPlugin
//     ]
// })

// export the plugin 
export { authPlugin }
