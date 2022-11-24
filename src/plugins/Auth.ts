import { envelop, Plugin } from '@envelop/core'
import { GraphQLError } from 'graphql'
import * as jwt from "jsonwebtoken";
import { APP_SECRET } from '../utils/auth';
let CurrentUserId = 0;

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

        if (!jwt.verify(token, APP_SECRET)) {
            setResultAndStopExecution(new GraphQLError('Not authenticated'))
        }
        CurrentUserId = jwt.verify(token, APP_SECRET).userId
        console.log(CurrentUserId)
        // if the user is authenticated set the CurrentLoggedInUser to the user id
        // console.log(jwt.verify(token, APP_SECRET))


    }
}

export { authPlugin }
