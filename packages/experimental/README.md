# `@yorgos/experimental`

This is an experiment in writing an actor framework written in TypeScript that allows one to create apps that are distributed across networks of devices that can run JS. It aims to be a loose and simple implementation of the concept.

In short: **it runs in browsers, too** *and* it does **transparent remoting**.

**You have to roll your own transports** for remoting to work, though. This allows for the kind of flexibility that was lacking in other actor frameworks, and was the spark that created this project.

## Versioning

Instead of "pre-release" versions until the project matures, this is a package that allows the sole author (hi, it's me!) to write messy code, not spend too much time worrying about commit logs and change direction whenever needed.

Once the project achieves most of its goals, it'll be broken down into smaller pieces and released as different packages under the `@yorgos` umbrella.

## Code examples and guide

The [project repo's Readme](https://github.com/kunaakos/yorgos) has a complete guide.
