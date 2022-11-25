import { Plugin } from '@envelop/core'
import { GraphQLError } from 'graphql'
import * as jwt from "jsonwebtoken";
import { APP_SECRET } from '../utils/auth';

const authPlugin: Plugin = {

    // get the authorization header from the request
    onExecute({ args:  { contextValue, operationName }, setResultAndStopExecution }) {
        // skip when login and signup mutations are called 
        if (['login', 'signup', 'getMetrics', 'getResponseTime'].includes(operationName)) return;

        const token = contextValue.req.headers.authorization
        if (!token) {
            setResultAndStopExecution({
                errors: [new GraphQLError('No token provided')],
            })
        }
        // verifying the token and getting the user id else throw an error
        if (!jwt.verify(token, APP_SECRET)) {
            setResultAndStopExecution(new GraphQLError('Provide a valid token'))
        }

        // passing it to the context so that it can be used in the resolvers
        contextValue.req.userId = jwt.verify(token, APP_SECRET).userId
    }
}

export { authPlugin }
