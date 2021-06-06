# @poying/websub

`@poying/websub` is an Node.js implementation of [WebSub](https://www.w3.org/TR/websub). This project is work in progress, We currently only implement [Subscriber](./src/subscriber).

## How To Use

### Installation

We only publish the package to GitHub registry,
so you have to tell npm/yarn to install the package from GitHub.
It's pretty simple, in the root folder of your project,
add file `.npmrc` with the following content:

```
 @poying:registry=https://npm.pkg.github.com
```

After that, you can install the package as noraml:

```bash
$ npm i @poying/websub
# or
$ yarn add @poying/websub
```

### Create subscriber

You can look into [this file](./src/cmd/subscriber.ts) to see how to create and use `Subscriber`.
