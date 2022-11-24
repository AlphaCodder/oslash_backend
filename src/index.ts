import { createServer } from 'node:http'
import { createYoga } from 'graphql-yoga'
import { schema } from './schema'
import { authPlugin } from './plugins/Auth'
import { metricsPlugin } from './plugins/Metrics'

function main() {
  const yoga = createYoga({ schema, plugins: [authPlugin, metricsPlugin] })
  const server = createServer(yoga)
  server.listen(4000, () => {
    console.info('Server is running on http://localhost:4000/graphql')
  })
}
 
main()
