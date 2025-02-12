# **yorgos** is a bit weird.

This is an experiment in writing an actor framework written in TypeScript that allows one to create apps that are distributed across networks of devices that can run JS. It aims to be a loose and simple implementation of the concept.

In short: **it runs in browsers, too** *and* it does **transparent remoting**.

## Overview

Actors communicate via **messages that can be serialized as JSON**, and address each other by ID only. IDs are plain strings that you can pass along in messages.

Multiple actor systems can be linked together to form a single network. Transport implementations are not part of the framework, but remoting and templates for implementing your own transports are. This allows you to choose your own protocols and deal with security as you wish (see code examples). 

**Actor hierarchy is flat** (parent-child relations and system map will be added in the future for cases that require a strict hierarchy), which makes it easier for actors to roam across diffent systems in your network.

The framework is *very verbose and explicit* and encourages you to be so in your own code. It tries to be as strict as possible, but it's all JS at the end of the day, and TypeScript coverage is meant to help you write and refactor code, not validate your data. That being said, *validation will be added as an optional feature*.

## Missing features and future goals

Although some of the goals of the project are already achieved, it's still in its infancy, and is being built for a personal project that required it.

Weakneses:
- structure, API and naming will change wildly with every major release
- important functionality is still missing: hierarchies, proper supervision, behaviors, persistence, validation...
- things are not optimized for performance, but for simplicity and convenience

What's coming:
- a simple approach to delay-tolerant messaging
- SoC-compatible modules (the core functions required to run an actor independently rely on async/await, which is not supported on JS runtimes that run on SoCs)
- figuring out an approach to supervision fit for this model
- figuring out a flexible approach to persistence

## Packages and version control

The package is published as `@yorgos/experimental` on npm, and each release is tagged and `main` should be in a working condition.

If/when a stable version arises, it'll be published as (a) different package(s), starting from version `1.0.0`.

## Code examples (and guide)

This guide:
- was written for `2.0.0`
- assumes you're using node.js and TypeScript with a strict config and good support for it in your IDE
- requires you to deal with (the very simple) app structure yourself
- skips first-party imports in code snippets, but **expect to find everything exported from the published package**

<details>

<summary>tsconfig recommendations</summary>

```JSON
{
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitReturns": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
}
```

</details>

#### Message and state types

Let's start with an actor that stores log entries, by first defining the messages it can accept:

```TypeScript
type NewLogEntryMessage = PlainMessage<'NEW_LOG_ENTRY', { entry: string }>
type RequestLogsMessage = QueryMessage<'REQUEST_LOG_ENTRIES', null>

type LoggerExpectedMessages = NewLogEntryMessage | RequestLogsMessage
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
- responses to queries are `ResponseMessage`s

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

In the future, a separate context object will be added for storing messy references, and `Serializable` actor states will be enforced. This is needed so you can snapshot actor state or dispatch it via a message to be stored by another node.

</details>


#### The Actor Function

The actor function - like a lot else in this framework - is just a type definition as far as the framework is concerned. As you'll see, most of yorgos is like this: defining the shapes of building blocks you can use to build your system.

By starting with declaring the type of our function as `ActorFn<LoggerState, LoggerExpectedMessages>`, we assure that everything in the fucntion body is checked by TypeScript. Try typing this instead of copy-pasting.

```TypeScript
const loggerActorFn: ActorFn<LoggerState, LoggerExpectedMessages> = ({ msg, state, dispatch }) => {
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
Cool cool, now let's get an actor system up and running. Spoiler alert: we'll be doing some remoting, so let's calle this "The Core System", because that's very sci-fi.

```TypeScript
coreSystem = initSystem({})

coreSystem.spawn({
    id: 'LOGGER',
    fn: loggerActorFn,
    initialState: { entries: [] },
})
```

We gave this actor a hard-coded, human-readable `ActorId` - which is a necessary evil sometimes - but you should pass a `uniqueId()` instead in most cases.

You now have a working system that you can message and query, but before we do that, let's write a *message template* (a simple function that returns a message). There's no builtin for this, and you don't have to do it, but it's a good pattern.

```TypeScript
const newLogEntryMessage = ({ entry, to }: { entry: string; to: ActorId }): NewLogEntryMessage => ({
    type: 'NEW_LOG_ENTRY',
    payload: { entry },
    meta: plainMeta({ to }),
})
```

Let's add some new entries using the template...

```TypeScript
;[
    'This is my first log.',
    'I often think about butterflies.',
    'I try to think less about insects, and where they all went to.',
].forEach((entry) => coreSystem.dispatch(newLogEntryMessage({ entry, to: 'LOGGER' })))
```

...and query the actor to fetch our entries:

```TypeScript
const { payload: { entries } } = await coreSystem.query<RequestLogEntriesMessage, LogEntriesMessage>({
    id: 'LOGGER',
    payload: null,
    type: 'REQUEST_LOG_ENTRIES',
})
console.log(entries)
```

It's good practice to wrap queries as reusable functions. Let's take the above, and wrap it for later use:

```TypeScript
const getLogEntriesVia = async (system: ActorSystem) => {
    const {
        payload: { entries },
    } = await system.query<RequestLogsMessage, LogEntriesMessage>({
        id: 'LOGGER',
        payload: null,
        type: 'REQUEST_LOG_ENTRIES',
    })
    return entries
}
```

With the above, querying becomes as easy as:

```TypeScript
console.log(await getLogEntriesVia(coreSystem))
```

<details>

<summary>Subtleties of queries</summary>

- `QueryFn` doesn't take a complete object of `RequestLogEntriesMessage` as a parameter, but creates one internally. This is done because for queries to work, the system needs to spawn a temporary actor for each query which will sit around and wait for an adequately addressed `ResponseMessage` or time out, which requires accurately crafted meta and some actor lifecycle management to work.
- There is no guarantee that you'll get a message of the expected type as an answer, and query does no validation other then checking `Message.meta`.
- Queries are not to be started by actors.

</details>


#### Implementing a transport using WebSockets

Building a transport is quite advanced, but it allows you to cleanly integrate with any app/infrastructure and lets you handle your own security. "The theory" explains how, `InitTransportHostFn` and `InitTransportClientFn` provide the templates.

Examples will be added as I develop and test more but **transport implementations will not be added to the main package**.

The examples use `ws` and implement a simple protocol to identify nodes and publish `ActorId`s. These are node.js examples, but either can be easily modified to work in the browser or other runtimes.

<details>

<summary>The theory - which suggest you revisit after finishing the guide.</summary>

Up goes down, down goes up, this bit is addmittedly a bit messy and confusing, and likely to change. The goal is to have a stack of middleware (for validation, buffering messages, filtering, authentication etc.) that form transports both on client and server side - but two-way communication makes that a bit tricky.

Two sets of callbacks (`Uplink` and `Downlink`) are exchanged between components to link them together into **streams** (not *node streams*) that have an `ActorSystem` at the bottom and a `Router` at the top. Like so:

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

This `LinkFn` is  **created by the upstream component** (`Router` or `TransportClient`) and **called by the downstream component** (`System`, `TransportHost`) components. The downstream component passes a `Downlink` to this function, and the return value is an `Uplink`.

Downstream component responsibilites:
- publish `ActorId`s that join and leave the public network from that node
- dispatch messages coming from the node
- request to close the connection

Upstream component responsibilities:
- keep track of `ActorId`s published by the downstream component **OR** pass them further upstream
- dispatch messages going to the node
- signal when the connection closes

</details>

<details>

<summary>Some simple utilities.</summary>

These will be shared by both client and host, and will be used to validate the simple commands used in this makeshift protocol.

```TypeScript
const isString = (val: any): val is string => typeof val === 'string'

const validateCommand = (message: any[]): [string, string[]] => {
    const [command, ...ids] = message
    if (!isString(command) || !ids.length || !ids.every(isString)) throw new Error('WS: malformed WS command.')
    return [command, ids]
}
```

</details>

<details>

<summary>The host</summary>

The hosts is will be connected to the router, and accepts incoming commands and messages from multiple remote systems, and creates a separate router link for each.

```TypeScript
import WebSocket, { WebSocketServer } from 'ws'

const onSocketConnection = (link: LinkFn) => (socket: WebSocket) => {
    console.info(`WS: new connection.`)

    let uplink: Uplink | null = null
    let remoteSystemId: ActorSystemId | null = null

    const onCommand = (message: string[]) => {
        const [command, ids] = validateCommand(message)
        if (uplink && command === 'JOIN') {
            uplink.publish(ids)
            return
        } else if (uplink && command === 'LEAVE') {
            uplink.unpublish(ids)
            return
        } else if (!uplink && command === 'SYSTEMID') {
            remoteSystemId = ids[0] as string
            const downlink: Downlink = {
                systemId: remoteSystemId,
                dispatch: (message: Message) => socket.send(JSON.stringify(message)),
                disconnect: onDisconnected,
            }
            uplink = link(downlink)
            console.info(`WS: ${remoteSystemId} identified.`)
            return
        } else {
            throw new Error('WS: unexpected command received.')
        }
    }

    const onMessage = (message: Message) => {
        if (!uplink) throw new Error('WS: received message from unidentified system.')
        uplink.dispatch(message)
    }

    const onWsMessage = (data: WebSocket.RawData) => {
        try {
            const message = JSON.parse(data.toString())
            if (Array.isArray(message)) {
                onCommand(message)
            } else {
                onMessage(message)
            }
        } catch (error) {
            console.error(error)
            disconnect()
        }
    }

    const disconnect = () => {
        uplink && uplink.disconnect()
    }

    const onDisconnected = () => {
        socket.close()
    }

    socket.on('message', onWsMessage)
}

const initWebSocketHost: InitTransportHostFn<{ port: number }> = async ({ link, port }) => {
    const server = new WebSocketServer({ port })
    console.info('WS: server running.')

    server.on('connection', onSocketConnection(link))

    server.on('close', () => {
        console.info('WS: server stopped.')
    })

    return {
        stop: async () => {
            server.close()
        },
    }
}
```

</details>

<details>

<summary>The client</summary>

```TypeScript
import WebSocket from 'ws'

const initWebSocketClient: InitTransportClientFn<{
    address: string | URL
}> = async ({ address }) => {
    const socket = new WebSocket(address)

    await new Promise<void>((resolve, reject) => {
        socket.once('open', () => {
            resolve()
        })
        socket.once('error', (error) => {
            reject(error)
        })
    })

    const link: LinkFn = (downlink) => {
        socket.on('message', (data) => {
            const message = JSON.parse(data.toString())
            downlink.dispatch(message)
        })

        const onDisconnected = () => {
            console.info(`WS transport: connection closed.`)
            downlink.disconnect()
        }

        const disconnect = () => {
            socket.once('close', () => {
                downlink.disconnect()
            })
        }

        const uplink: Uplink = {
            dispatch: (message: Message) => socket.send(JSON.stringify(message)),
            publish: (actorIds: ActorId[]) => socket.send(JSON.stringify(['JOIN', ...actorIds])),
            unpublish: (actorIds: ActorId[]) => socket.send(JSON.stringify(['LEAVE', ...actorIds])),
            disconnect,
        }

        socket.on('error', onDisconnected)
        socket.once('close', onDisconnected)
        socket.send(JSON.stringify(['SYSTEMID', downlink.systemId]))

        return uplink
    }

    return {
        link,
        stop: async () => {
            socket.close()
        },
    }
}
```

</details>

#### Putting it all together
Take the `system` (and the rest of the code from the previous examples), and connect it to a `Router`:

```TypeScript
const router = initRouter()
coreSystem.connectRemotes(router.link)
```

Now connect the same router to a WebSocket host implemented in the previous section:

```TypeScript
initWebSocketHost({ link: router.link, port: 3000 })
```

Create another system in a separate application:

```TypeScript
const clientSystem = initSystem({})
const webSocketClient = await initWebSocketClient({ address: 'ws://localhost:3000' })
clientSystem.connectRemotes(webSocketClient.link)
```

You can now message and query **any actor with a published `ActorId`** residing in any of the systems attached to this network.

```TypeScript
clientSystem.dispatch(
    newLogEntryMessage({
        entry: 'Birds seem to have followed the insects wherever they went.'
        to: 'LOGGER',
    })
)
```

To verify if it worked, let's reuse the query from a previous example:

```TypeScript
console.log(await getLogEntriesVia(clientSystem))
```

Any number of clients can connect to this host, it'll create links for new connections automatically. You can even attach multiple instances of a `TransportHost` to the same router.

You can implement `TransportHost`s for different protocols/libraries/hardware - anything as long as you can get JSON from A to B - and use several types of them in the same system.

With a bit of glue code, you can spawn independent actors and link them to systems, link two systems directly without a router, write transport middleware - all undocumented for now, but proper tooling for such feature should be added in the future.

This is the end, I hope you had fun, and see the possibilites such an approach offers!

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
- incremental builds and composite projects are currently disabled (these will be needed with more packages in this repo, but until then it's easier to just discard the `dist` directory before every build, making sure no junk makes its way to a published package)

### `@yorgos/experimental` builds

This package is built as an ES module using the typescript compiler, without any bundlers. It's built to `ES2022` - assuming that if you're using it you're either using the latest version of node, or you're going to run it through a bundler anyways.

The package relies on some path mapping set in `tsconfig.json`, these need to be transformed to relative paths in `dist`, which is handled using [typescript-transform-paths](https://github.com/LeDDGroup/typescript-transform-paths) and [ts-patch](https://github.com/nonara/ts-patch).

## Inspiration

Kudos to the authors of [nact](https://github.com/nactio/nact) and [comedy](https://github.com/untu/comedy), two projects which have inspired a lot of this framework.
