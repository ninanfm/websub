# @ninanfm/websub

> This project is still working in progress, not well tested, so take your own risk to use it.

`@ninanfm/websub` is an Node.js implementation of [WebSub](https://www.w3.org/TR/websub).

## Features

- [X] Subscriber
- [ ] Publisher
- [ ] Hub (we won't implement this part of specification, because almost all of the publishers are using Google's hub, no one need to maintain their own hub.)

## How To Use

### Installation

We only publish the package to the GitHub registry, you have to tell npm/yarn to install the package from GitHub. It's pretty simple, in the root folder of your project, create a file called `.npmrc` with the following content:

```
 @ninanfm:registry=https://npm.pkg.github.com
```

After that, you can install the package as normal:

```bash
$ npm i @ninanfm/websub
# or
$ yarn add @ninanfm/websub
```

### Create subscriber

You can look into [this file](./src/cmd/subscriber.ts) to see how to create and use `Subscriber`.

## License

[MIT](./LICENSE)
