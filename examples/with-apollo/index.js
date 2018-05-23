const polka = require('polka')
const bodyParser = require('body-parser')
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express')
const { makeExecutableSchema } = require('graphql-tools')

const { PORT = 3000 } = process.env
const app = polka()

const tasks = [
  { id: 1, name: 'Go to Market', complete: false },
  { id: 2, name: 'Walk the dog', complete: true },
  { id: 3, name: 'Take a nap', complete: false }
]

const typeDefs = `
  type Task {
    id: Int!
    name: String!
    complete: Boolean!
  }

  type Query {
    tasks: [Task]
    task(id: Int!): Task
  }
`

const resolvers = {
  Query: {
    tasks: () => tasks,
    task: (_, args) => tasks.find(o => o.id === args.id)
  }
}

const schema = module.exports = makeExecutableSchema({
  typeDefs,
  resolvers
})

app.use(bodyParser.json())

app.post('/graphql', graphqlExpress(req => ({
  schema
})))

app.get('/graphiql', graphiqlExpress({
  endpointURL: '/graphql'
}))

app.listen(PORT).then(_ => {
  console.log(`> Ready on localhost:${PORT}`)
})
