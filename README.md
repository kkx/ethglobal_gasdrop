# Gasdrop

This project is built during Ethglobal Lisbon. for more information please refer [here](https://ethglobal.com/showcase?q=gasdrop)

This repository is a fork of [safe wallet interface](https://github.com/safe-global/safe-wallet-web/). For more information please follow it's instructions

## Additional environment variable

`AIRSTACK_API_KEY` is required to support airstack api.

## Running the app locally

Install the dependencies:

```bash
yarn
```

Run the development server:

```bash
yarn start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## Lint

ESLint:

```
yarn lint --fix
```

Prettier:

```
yarn prettier
```

## Tests

Unit tests:

```
yarn test --watch
```

## Relayer

For running the relayer please refer its instruction [here](./relayer/relayer/README.md)
