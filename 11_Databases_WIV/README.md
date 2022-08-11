# Frontend database

Sceniro: Sometimes, **we want to stored data is still available even if the user closes the app.**

## Option1: Setup a web server
## Option2: Serverless database
- localStroge: up to 5MB
- IndexedDB: a bit slower, but no size limit


# Window.localStorage

https://developer.mozilla.org/zh-TW/docs/Web/API/Window/localStorage

Have limitation for `5MB`

```js
// Save data
localStorage.setItem('userName', 'ansoni');

// Access it back, even after closing the browser
const name = localStorage.getItem('userName'); 
```

# IndexedDB

https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

# dexie.js is an API for IndexedDB

https://dexie.org/

```cmd
npm i dexie
```

## when you try to put something in the memory -> serialize it

`serialize` -> data be expressed to string

- JSON.parse()
- file.arrayBuffer()