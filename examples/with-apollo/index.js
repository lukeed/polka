const polka = require('polka');
const { json } = require('body-parser');
const { makeExecutableSchema } = require('graphql-tools');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');

const { PORT=3000 } = process.env;

const tasks = [
	{ id: 1, name: 'Go to Market', complete: false },
	{ id: 2, name: 'Walk the dog', complete: true },
	{ id: 3, name: 'Take a nap', complete: false }
];

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
`;

const resolvers = {
	Query: {
		tasks: () => tasks,
		task: (_, args) => tasks.find(o => o.id === args.id)
	}
};

const schema = module.exports = makeExecutableSchema({ typeDefs, resolvers });

polka()
	.use(json())
	.post('/graphql', graphqlExpress(req => ({
		schema
	})))
	.get('/graphiql', graphiqlExpress({
		endpointURL: '/graphql'
	}))
	.listen(PORT, () => {
		console.log(`> Ready on localhost:${PORT}`)
	});
