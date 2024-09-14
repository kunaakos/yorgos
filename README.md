# **yorgos** is a bit weird.

It is an experimental actor system written in TypeScript. It's written with a certain project of mine in mind, not to mimic existing actor model implementations.

It's published as `@yorgos/experimental`, to allow me to bump version numbers with wild abandon. If/when a stable version arises, it'll be published as a different package, starting from version `1.0.0`.

In short, *this is an actor system for IoT*.

## Overview

Actors communicate via messages that can be serialized as JSON, addressing each other by id only. Everything should happen asynchronously. This is already implemented and more or less thought out.

At some point in the future **yorgos** should allow for a distributed actor system where actors form a mesh network, allowing actors/nodes to roam, have intermittent connections, and be more independent in general. There are a lot of open questions related to this, and I have to study and think a bit more to answer them. 

Given how messaging happens, and how easy it is to run an actor independently, it's going to be very easy to implement the equivalents of `SpawnFn` and message routing functions in other languages - which is enough to run a node on a low-powered SoC, for example.

## Documentation

If you're interested in playing with this, look throgh the code, and keep in mind that this `README` could be outdated.

Starting points with explanations in the comments, which should be read in the order listed:
 - `src/types/system.ts` contains the definitions of the entities one has to start with as a consumer of the library
 - `src/types/actor.ts` contains definitons and explanations relating to `Actor`s
 - `src/spawn.ts` helps one understand how and what actors are composed (of)
 - finally, `src/system.ts` for putting it all together

 I'm going for the mythical "self-documenting, readable code", so if there are no comments, just read the code!

## Code examples

I'm still short of a few utilities that make this usable, expect examples once I'm done with those.

## Goals

I try to implement as little as I can get away with, and I'm currently thinking about:
- system hierarchy
- actor lifecycle management and garbage collection
- location transparency / message routing
