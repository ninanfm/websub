# @ninanfm/websub

`@ninanfm/websub` is an Node.js implementation of [WebSub](https://www.w3.org/TR/websub). This project is working in progress, we currently only implement [Subscriber](./src/subscriber).

## How To Use

### Installation

We only publish the package to the GitHub registry, you have to tell npm/yarn to install the package from GitHub. It's pretty simple, in the root folder of your project, add file `.npmrc` with the following content:

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

@ninanfm/websub offers two licenses:

1. [MIT](./LICENSE)
2. [COMMERCIAL-LICENSE](./COMMERCIAL-LICENSE)
