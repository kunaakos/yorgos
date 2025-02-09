# **yorgos** is a bit weird.

It is **an experiment** in writing an actor framework in TypeScript that allows one to create apps that are distributed across: processes, tabs, iframes, workers, embedded devices, serverless functions - in any combination.

It aims to be simple and modular, with the least amount of dependencies possible, which allows you to have actors running on tiny and cheap SoCs while effortlessly communicating with the rest of the application.

It's being written in a style that makes it easy to port to other languages.

## Overview

Actors communicate via **messages that can be serialized as JSON**, and address each other by ID only. IDs are plain strings that you can pass along in messages.

Multiple actor systems can be linked together to form a single network. Transports are not implemented as part of the framework, but remotin and templates for implementing your own transports are. This allows you to choose your own protocols and deal with security as you wish (see code examples).

**Actor hierarchy is flat** (*parent-child relations and system map will be added* for cases that require a strict hierarchy), which makes it easier for actors to roam across diffent systems in your network.

The framework is *very verbose and explicit* and encourages you to be so in your own code. It tries to be as strict as possible, but it's all JS at the end of the day, and TypeScript coverage is meant to help you write and refactor code, not validate your data. That being said, *validation will be added as an optional feature*.

## Caveats

- things are not optimized for performance, but for simplicity and convenience
- important functionality is still missing: hierarchies, proper supervision, behaviors, persistence, validation... but the framework is already usable for simple projects
- structure, API and naming will change wildly with every major release

## Packages and version control

The package is published as `@yorgos/experimental` on npm, and each release is tagged and `main` should be in a working condition.

If/when a stable version arises, it'll be published as (a) different package(s), starting from version `1.0.0`.

## Code examples (and guide)

This guide was written for `2.0`, assumes you're using node.js, and requires you to deal with (the very simple) app structure yourself.

It will eventually move on to live as an example in the repo, but I find this approach to be better for documenting and explaining.

Imports are left out of examples, but **expect to find all types exported from the published package**.

**Sorry for any inconsistencies and typos.**

#### Message and state types

Let's start with an actor that stores log entries, by first defining the messages it can accept:

```TypeScript
type LogMessage = PlainMessage<'LOG', { entry: string }>
type RequestLogEntriesMessage = QueryMessage<'REQUEST_LOG_ENTRIES', null>

type LoggerExpectedMessages = LogMessage | RequestLogsMessage
```

And the outgoing message it'll respond to the `REQUEST_LOG_ENTRIES` queries with:

```TypeScript
type LogEntriesMessage = ResponseMessage<'LOG_ENTRIES', { entries: string[] }>
```
<details>

<summary>On message types and structure.</summary>

The messages are of different subtypes of `Message`:
- `PlainMessage`s that you don't expect a response to
- `QueryMessage`s expect a response
- ...which should be a `ResponseMessage`

They accept two type parameters: 
- `MessageTypeIdentifier`, which is an uppercase string
- `PayloadType` which needs to be a subtype of `Serializable` - **no references can or should be passed via a message** - this is enforced by the `Mailbox`.

We want to be explicit about anything that's *not there* so the payload type for messages without any is `null`.

</details>

Finally, let's define the actor's state:

```TypeScript
type LoggerState = { entries: string[] }
```

<details>

<summary>On the contents of actor state.</summary>

Ideally, actor state should also be `Serializable`, but this isn't enforced, because you often have to hold references to all sorts of objects and functions the framework cannot provide.

In the future, a separate context object will be added for storing messy references, and `Serializable` actor states will be enforced, so you can snapshot actor state or dispatch it via a message to be stored by another node.

</details>


#### The Actor Function

The actor function - like a lot else in this framework - is just a type. We pass the previously written state and message types to `ActorFn`, and implement a simple function that takes a `Message` as input, and returns the updated state (or `null`, if nothing changed).

```TypeScript
export const loggerActorFn: ActorFn<LoggerState, LoggerExpectedMessages> = ({ msg, state, dispatch }) => {
     switch (msg.type) {
        case 'NEW_LOG_ENTRY':
            return { entries: [...state.entries, msg.payload.entry] }
        case 'REQUEST_LOG_ENTRIES':
            const responseMessage: LogEntriesMessage = {
                type: 'LOG_ENTRIES',
                payload: state,
                meta: responseMetaTo(msg.meta),
            }
            dispatch(responseMessage)
            return null
        default:
            throw new Error('Unexpected message type.')
    }
}
```

<details>

<summary>A few things of note.</summary>

- Helpers are available to generate all types of `msg.meta: MetaType`. In this case, `responseMetaTo` generates valid meta for a query response, which the system needs to resolve the query.
- **We have no way of knowing what came in as a message**, so you have to duck type, which `MessageTypeIdentifiers` help with. This does not ensure that the message is valid, because `dispatch` allows you to send any valid message to any address. If you want runtime safety, you need to validate. Everything else should be pretty neatly covered.

</details>

#### Actor Systems
Cool cool, now let's get an actor system up and running.

```TypeScript
const system = initSystem({})

system.spawn({
    id: 'LOGGER',
    fn: loggerActorFn,
    initialState: { entries: [] },
})
```

We gave this actor a hard-coded, human-readable `ActorId` - which is a necessary evil sometimes - but you should pass a `uniqueId()` instead in most cases.

You now have a working system that you can message and query, but before we do that, let's write a *message template* to help with that. There's no builtin for this, and you don't have to do it, but it's a good pattern.

```TypeScript
export const newLogEntryMessage = ({
    entry,
    to
}: {
    entry: string,
    to: ActorId
}): NewLogEntryMessage => ({
    type: 'NEW_LOG_ENTRY',
    payload: { entry },
    meta: plainMeta({ to })
})

```

These are verbose, but a breeze to write, because autocomplete does most of it on an IDE with good TS support.

Let's add some new entries...

```TypeScript
;[
    'This is my first log.',
    'I often think about butterflies.',
    'I try to think less about insects, and where they all went to.',
].forEach(entry => system.dispatch(newLogEntryMessage({ to: 'LOGGER', entry })))
```

...and query the actor to fetch our entries:

```TypeScript
const { payload: { entries } } = await system.query<RequestLogEntriesMessage, LogEntriesMessage>({
    id: 'LOGGER',
    payload: null,
    type: 'REQUEST_LOG_ENTRIES',
})
console.log(entries)
```

It's recommended that you wrap queries as reusable functions, let's take the above, and wrap it for later use:

```TypeScript
const getLogEntriesVia = async (system: ActorSystem) => {
    const { payload: { entries } } = await system.query<RequestLogsMessage, LogEntriesMessage>({
        id: 'LOGGER',
        payload: null,
        type: 'REQUEST_LOG_ENTRIES',
    })
    return entries
}
```

<details>

<summary>Subtleties of queries</summary>

- `QueryFn` doesn't take a complete `RequestLogEntriesMessage` as a parameter, but creates one internally. This is done because for queries to work, the system needs to spawn a temporary actor for each query which will sit around and wait for an adequately addressed `ResponseMessage` or time out.
- There is no guarantee that you'll get a message of the expected type as an answer, and query does no validation other then checking `Message.meta`.
- Queries are not to be started by actors.

</details>


#### Implementing a transport using WebSockets

Building a transport is quite advanced, but it allows you to cleanly integrate with any app/infrastructure and lets you handle your own security. "The theory" explains how, `InitTransportHostFn` and `InitTransportClientFn` provide the templates.

Examples will be added as I develop and test more but **transport implementations will not be added to the main package**.

The examples use the well-known `ws` library, and implement a simple protocol to identify nodes and publish `ActorId`s. You **need to publish addresses of `Actor`s, otherwise they're only accessible locally**.

<details>

<summary>The theory - which suggest you revisit after finishing the guide.</summary>

...because it's a bit messy.

Instead of using `EventEmitter`s or some other event-based or pubsub implementation (which would be less portable and/or could get more complicated), two sets of callbacks (`Uplink` and `Downlink`) are exchanged between components to link them together into **streams** (not *node streams*) that have an `ActorSystem` at the bottom and a `Router` at the top. Like so:

```
   ┌────► Uplink ──────┐
   │                   ▼
SystemA             Router
   ▲                   │
   └──── Downlink ◄────┘

   ┌────► Uplink ──────┐                   ┌────► Uplink ──────┐
   │                   ▼                   │                   ▼ 
SystemB         TransportClient  ...  TransportHost         Router
   ▲                   │                   ▲                   │
   └──── Downlink ◄────┘                   └──── Downlink ◄────┘

downstream ◄────────────────────────────────────────────► upstream
```

A function is used to exchange callbacks between components.

This `CreateLinkFn` is  **created by the upstream component** (`Router` or `TransportClient`) and **called by the downstream component** (System, TransportServer) components. The downstream component passes a `Downlink` to this function, and the return value is an `Uplink`.

Downstream component responsibilites:
- publish `ActorId`s that join and leave the public network from that node
- dispatch messages coming from the node
- request to close the connection

Upstream component responsibilities:
- keep track of `ActorId`s published by the downstream component **OR** pass them further upstream
- dispatch messages going to the node
- signal when the connection closes

Up goes down, down goes up, it's messy and confusing, but easy to implement once you got the idea, and very to use once implemented.

</details>

<details>

<summary>Some simple utilities.</summary>

These will be shared by both client and host.

```TypeScript
const isString = (val: any): val is string => typeof val === 'string'

const validateCommand = (message: any[]): [string, string[]] => {
    const [command, ...ids] = message
    if (!isString(command) || !ids.length || !ids.every(isString))
        throw new Error('WS: malformed WS command.')
    return [command, ids]
}
```

</details>

<details>

<summary>The host</summary>

```TypeScript
import WebSocket, { WebSocketServer } from 'ws'

const initWebSocketHost: InitTransportHostFn<{ port: number }> = async ({createLink, port }) => {
    const server = new WebSocketServer({ port })
    console.info('WS: server running.')

    server.on('connection', (socket) => {
        console.info(`WS: new connection.`)

        let uplink: Uplink | null = null
        let remoteSystemId: ActorSystemId | null = null

        const cleanup = () => {
            uplink = null
            socket.close()
        }

        const messageHandler = (data: WebSocket.RawData) => {
            try {
                // all messages are JSON, and can be...
                const message = JSON.parse(data.toString())
                
                if (Array.isArray(message)) {
                    // ..."commands", in the form of arrays...
                    const [command, ids] = validateCommand(message)
                    
                    switch (command) {
                        case 'SYSTEMID':
                            remoteSystemId = ids[0] as string
                            const downlink: Downlink = {
                                systemId: remoteSystemId,
                                dispatch: (message: Message) => socket.send(JSON.stringify(message)),
                                onDestroyed: cleanup
                            }
                            uplink = createLink(downlink)
                            console.info(`WS: ${remoteSystemId} identified.`)
                            return

                        case 'JOIN':
                            if (!uplink) throw new Error('WS: received command from unidentified system.')
                            ids.forEach(uplink.publish)
                            return

                        case 'LEAVE':
                            if (!uplink) throw new Error('WS: received command from unidentified system.')
                            ids.forEach(uplink.unpublish)
                            return

                        default:
                            throw new Error(`WS: unrecognized WS command "${command}".`)
                    }
                } else {
                    // ...or messages in form of Objects.
                    if (!uplink) throw new Error('WS: received message from unidentified system.') 
                    uplink.dispatch(message)
                }
            } catch (error) {
                socket.off('message', messageHandler) // stop processing messages immediately
                console.error(error)
                console.warn(`WS: Closing connection from ${remoteSystemId ? remoteSystemId : 'unidentified system'}.`)
                socket.close()
            }
        }

        socket.on('message', messageHandler)

        socket.on('error', (error) => {
            uplink && uplink.destroy()
            console.error(error)
        })

        socket.on('close', () => {
            uplink && uplink.destroy()
            console.info(`WS: Connection from ${remoteSystemId ? remoteSystemId : 'unidentified system'} closed.`)
        })
    })

    server.on('close', () => { console.info('WS: server stopped.')})

    return {
        stop: async () => { server.close() }
    }
}
```

</details>

<details>

<summary>The client</summary>

```TypeScript
import WebSocket from 'ws'

export const initWebSocketClient: InitTransportClientFn<{ address: string | URL }> = async ({ address }) => {
    const socket = new WebSocket(address)

    socket.on('error', (error) => { throw error })

    await new Promise<void>((resolve) => {
        socket.on('open', () => {
            resolve()
        })
    })

    const createLink: CreateLinkFn = (downlink) => {
        socket.on('close', () => {
            console.info(`WS transport: connection closed.`)
            downlink.onDestroyed()
        })

        socket.on('message', (data) => {
            const message = JSON.parse(data.toString())
            if (Array.isArray(message)) {
                const [command, ] = validateCommand(message)
                switch (command) {
                    default:
                        throw new Error(`WS: unrecognized WS command "${command}".`)
                }
            } else {
                downlink.dispatch(message)
            }
        })

        socket.send(JSON.stringify(['SYSTEMID', downlink.systemId]))

        return {
            dispatch: (message: Message) =>
                socket.send(JSON.stringify(message)),
            publish: (actorId: ActorId) =>
                socket.send(JSON.stringify(['JOIN', actorId])),
            unpublish: (actorId: ActorId) =>
                socket.send(JSON.stringify(['LEAVE', actorId])),
            destroy: () => {
                socket.close()
            },
        }
    }

    return {
        createLink,
        stop: async () => { socket.close() }
    }
}
```

</details>


#### Putting it all together
Take the `system` (and the rest of the code from the previous examples), and connect it to a `Router`:

```TypeScript
const router = initRouter()
system.connectRemotes(router.createLink)
```

Now connect the same router to a websocket server implemented in the previous section:

```TypeScript
initWebSocketServer(router.createLink)
```

Create another system in a separate application:

```TypeScript
const clientSystem = initSystem({})
const createLink = await initWebSocketClient()
clientSystem.connectRemotes(createLink)
```

You can now message and query **any actor with a published `ActorId`** residing in any of the systems attached to this network.

```TypeScript
clientSystem.dispatch(
    newLogEntryMessage({
        to: 'LOGGER',
        entry: 'Birds seem to have followed the insects wherever they went.'
    })
)
```

To verify if it worked, let's reuse the query from a previous example:

```TypeScript
console.log(await getLogEntriesVia(clientSystem))
```

Any number of clients can connect to this host, it'll create links for new connections automatically, and you can attach multiple instances to the same router.

Any protocol can be implemented as a transport, and used simultaneously with any other protocol.

This is the end, I hope you had fun!


## Reading the code

Starting points are to be found in `packages/experimental/src` with explanations in the comments:
 - `types/system.ts` contains the definitions of the entities one has to start with as a consumer of the library
 - `types/actor.ts` contains definitons and explanations relating to `Actor`s
 - `spawn.ts` helps one understand how and what actors are composed (of)
 - finally, `system.ts` for putting it all together

And just, click your way through imports I guess. Other than the sometimes convoluted higher order functions it should be plain, straightforward TS.

## Developing the library

In the project root:

`npm run tests` to run tests for all packages

`npm run builds` to build all packages

`npm run format` to format the entire repo (`js`, `ts`, `json`)

### Notes to self

- `// NOTE: ...` comments are shortcuts, hacks, things that are not self-explanatory, poorly implemented etc.
- had to downgrade `typescript` to `5.5.4` because of [an issue with `ts-transform-paths`](https://github.com/LeDDGroup/typescript-transform-paths/issues/266)
- incremental builds and composite projects are currently disabled (these will be needed with more packages in this repo, but until then it's easier to just discard the `dist` directory before every build, making sure no junk makes its way to a published package)

### `@yorgos/experimental` builds

This package is built as an ES module using the typescript compiler, without any bundlers. It's built to `ES2022` - assuming that if you're using it you're either using the latest version of node, or you're going to run it through a bundler anyways.

The package relies on some path mapping set in `tsconfig.json`, these need to be transformed to relative paths in `dist`, which is handled using [typescript-transform-paths](https://github.com/LeDDGroup/typescript-transform-paths) and [ts-patch](https://github.com/nonara/ts-patch).

 