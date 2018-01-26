# Example: Firebase-Admin TodoMVC

This example uses Polka as an API layer (via [`firebase-admin`](https://www.npmjs.com/package/firebase-admin)) and as a static asset server (via [`serve-static`](https://www.npmjs.com/package/serve-static)).

It's also using [Parcel](https://github.com/parcel-bundler/parcel), a zero-config bundler, to compile a [Preact](https://github.com/developit/preact) implementation of the [TodoMVC](http://todomvc.com) application.

Once up and running, you will be forced to Register/Login (`/login`) before accessing the TodoMVC app. All TodoMVC actions are sent to the Firebase Real-time Database for confirmation _before_ applying the change(s) in the browser.

> This is partly to illustrate how quickly the Firebase RTDB operates!

## Setup

1. You must create a [new Firebase project](https://firebase.google.com/docs/web/setup)

    _For the purposes of this demo, it's free!_

2. You must retrieve a [Firebase Service Account](https://firebase.google.com/docs/admin/setup#add_firebase_to_your_app).

    _**Hint:** Click "Generate New Private Key"_

3. Save the Account credentials to `with-firebase/secret.json`

    _This file is accessed inside `with-firebase/api/services.js` to connect to your Database._

4. Install & build dependencies

    ```sh
    # Install server dependencies
    $ npm install
    # Install client dependencies & build
    $ cd client && npm install && npm run build
    # Run the server!
    $ cd .. && npm start
    ```

## Usage

Open a browser to `localhost:3000`!

You also try interacting with the API, but all routes require a Firebase Token identifier.
> AKA, it won't work :D

```sh
$ curl localhost:3000/api/items
#=> (401) Token not found.

$ curl -H "Authorization: Bearer foobar" localhost:3000/api/items
#=> (401) Invalid token.
```
