const polka = require('polka');
const { json } = require('body-parser');
const send = require('@polka/send-type');
const { graphql, buildSchema } = require('graphql');

const { PORT=3000 } = process.env;

const tasks = [
	{ id:1, name:'Go to Market', complete:false },
	{ id:2, name:'Walk the dog', complete:true },
	{ id:3, name:'Take a nap', complete:false }
];

const schema = buildSchema(`
	type Task {
		id: Int!
		name: String!
		complete: Boolean!
	}

	type Query {
		tasks: [Task]
		task(id: Int!): Task
	}
`);

let ctx = {
	tasks: () => tasks,
	task: (args) => tasks.find(o => o.id === args.id)
};

polka()
	.use(json())
	.post('/', (req, res) => {
		let { query } = req.body;
		// We could use `async` & `await` here
		// but requires Node 8.x environment to run
		graphql(schema, query, ctx).then(data => {
			send(res, 200, data);
		});
	})
	.listen(PORT).then(_ => {
		console.log(`> Ready on localhost:${PORT}`);
	});
