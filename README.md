# Monaco + Automerge

> A project combinging the [Monaco Text Editor](https://microsoft.github.io/monaco-editor/) and [Automerge CRDT](https://automerge.org/)

The production deployment can be visited at https://monaco-automerge.onrender.com/

## Development

### Prerequisites

1. [NVM](https://github.com/nvm-sh/nvm) is installed

### Instructions

1. Navigate to root of cloned repository
2. Verify correct version of Node is installed

   ```sh
   $ nvm install
   ```

3. Verify you are using correct version on Node

   ```sh
   $ nvm use
   ```

4. Start the development server

   ```
   npm run dev
   ```

### Testing

#### Unit and Integration

```sh
$ npm run test
```

See [Vitest CLI documentation](https://vitest.dev/guide/cli) for additional options and commands.

#### Acceptance

```sh
$ npx playwright test
```

Using [Playwright CLI documentation](https://playwright.dev/docs/test-cli) for additional options and commands.

## Development

Deployed as a [Web Service](https://docs.render.com/web-services) on render.com. If you would like to test a production style build locally use the following commands:

### Build command

```sh
$ NODE_ENV="production" npm run build
```

### Start command

```sh
$ NODE_ENV="production" npm run start
```

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

### Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./tsconfig.json", "./tsconfig.node.json"],
    tsconfigRootDir: __dirname,
  },
};
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
