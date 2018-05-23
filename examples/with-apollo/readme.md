# Example: GraphQL

Tiny example with [Apollo Graphql](https://github.com/graphql/graphql-js)

## Setup
```sh
$ npm install
$ npm start
```

## Usage
You can test it with any apollo client or with the [Graphiql](https://github.com/graphql/graphiql) in [localhost](http://localhost:3000/graphiql)

## Available queries
```
{
  tasks {
    id
    name
    complete
  }
}
```

```
{
  task (id: Int!) {
    id
    name
    complete
  }
}
```

![Screenshot](screenshot.png)
