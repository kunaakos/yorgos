# `@yorgos/experimental`

## Build

This package is built as an ES module using the typescript compiler, without any bundlers. It's built to `ES2022` - assuming that if you're using it you're either using the latest version of node, or you're going to run it through a bundler anyways.

The package relies on some path mapping set in `tsconfig.json`, these need to be transformed to relative paths in `dist`, which is handled using [typescript-transform-paths](https://github.com/LeDDGroup/typescript-transform-paths) and [ts-patch](https://github.com/nonara/ts-patch).
