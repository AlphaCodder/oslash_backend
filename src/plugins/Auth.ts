import { Plugin } from '@envelop/core'
import { GraphQLError } from 'graphql'
import * as jwt from "jsonwebtoken";
import { APP_SECRET } from '../utils/auth';

const authPlugin: Plugin = {

    // get the authorization header from the request
    onExecute({ args:  { contextValue }, setResultAndStopExecution }) {
        const token = contextValue.req.headers.authorization

        // verifying the token and getting the user id else throw an error
        if (!jwt.verify(token, APP_SECRET)) {
            setResultAndStopExecution(new GraphQLError('Not authenticated'))
        }

        // passing it to the context so that it can be used in the resolvers
        contextValue.req.userId = jwt.verify(token, APP_SECRET).userId

    }
}

export { authPlugin }
