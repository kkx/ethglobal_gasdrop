# <img src="./public/images/logo.png" height="60" valign="middle" alt="Gasdrop" /> Gasdrop

This project is built during the Ethglobal Lisbon hackathon. Gasdrop allows users to interact with dApps without paying gas fees. Instead, they are shown Ads provided by sponsors during the transaction. for more information please refer [here](https://ethglobal.com/showcase?q=gasdrop)

This repository is a fork of safe wallet interface. For more information please follow check [here](https://github.com/safe-global/safe-wallet-web/).

## Additional environment variable

`AIRSTACK_API_KEY` is required to support airstack api.

## Relayer

Relayer is required to be started before running the web interface since the relayer will actually send a signed transaction to the blockchain network. For running the relayer please refer its instructions [here](./relayer/relayer/README.md)

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
