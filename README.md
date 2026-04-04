## Yorgos 3

Yorgos is - in a loose sense - an actor system implementation. It's **functional** and **type-driven**. Yorgos provides the tools to build actor systems with behaviors customized to your needs, and linking them together using various protocols and providers you roll however you see fit.

It's **zero-dependency** and **minimalist**. It's not built for hyperscale and throughput, rather flexibility and ease of use.

The code is written with **portability** in mind. The end goal is having systems that allow transparent messaging between servers, lambdas, SoCs and user interfaces (which are not necessarily web-based).

Talk is cheap, but to create an actor system with a stateful actor and a transport host ready to accept connections:

```TypeScript
const systemA = makeSystem()

export type LogEntriesMessage = ResponseMessage<'LOG_ENTRIES', LoggerState>
export type AppendLogMesssage = PlainMessage<'APPEND_LOG', { entry: string }>
export type FlushLogMesssage = QueryMessage<'FLUSH_LOG'>

type LoggerAcceptedMessages = AppendLogMessage | FlushLogMessage
type LoggerState = { entries: string[] }

export const loggerActorFn: ActorFn<LoggerAcceptedMessages, LoggerState> = usingHandlers({
    APPEND_LOG: ({ msg, state }) => ({
        entries: [
            ...state.entries,
            msg.payload.entry
        ]
    }),
    FLUSH_LOG: ({ msg, state,dispatch }) => {
        dispatch({
            type: 'LOG_ENTRIES',
            payload: {entries: state.entries},
            meta: responseMetaTo(msg.meta)
        })
        return {
            entries: []
        }
    }
})

systemA.spawnStateful({
    id: 'LOGGER',
    fn: loggerActorFn,
    initialState: { entries: [] } as LoggerState,
})

const router = initRouter()
systemA.connectRemotes(router.link)
initWebSocketHost({ link: router.link, port: 3000 })
```

And a second system connected via WebSockets that interacts with it:
```TypeScript
const systemB = makeSystem()

const webSocketClient = await initWebSocketClient({ address: 'ws://localhost:3000' })
systemB.connectRemotes(webSocketClient.link)

const { payload: { entries } } = await system.query<FlushLogMessage, LogEntriesMessage>({
    id: 'LOGGER',
    type: 'FLUSH_LOG',
    payload: null
})
```

`initWebSocketHost` and `initWebSocketClient` are not exported by the library, nor will they be. These are **transports** - code for which can be found in [the examples](). There's a lot you have to roll yourself, but that's kind of the point: you don't have to waste your time bending the code to your will, and you don't need the whole kitchen sink to get an actor node running.

Consider this fictional code, running on an [espruino](https://www.espruino.com/) board:
```TypeScript
const messaging = initOneWayHttpsMessagingClient({ url, token, fetchInterval })

messaging.connectActor({
    id: queryActorId,
    dispatch: (msg: AcceptedMessage) => {
        /* do the thing */
    },
})
```
...if there's a `initOneWayHttpsMessagingHost` attached to `systemA` on the other end, for example, you'll have no trouble reaching this standalone "actor" from `systemB`, running in a browser. *And that opens up possibilities.*

## Glossary and Overview

`CodeSnippets` contain types and functions you'll find exported by the library.

The most important thing to know about this library is that **you can use and/or replace its pieces to implement different behaviors and topologies**. Deals deals with spawning and managing actors, their state and the relations and connections between them. It's not too opnionated in the matter.

In its current state **it's an ongoing experiment** and **a fun toy**. If you see something in that code that makes you think "well this would not fly in a real production system" - you're absolutely right. There are several stopgap solutions and overly simplified implementations, as intended, *to make shaping the library easier*.

### Actors and Actor Functions

`Actor`s communicate by `dispatch`ing `Message`s addressed to other `ActorId`s. `Message`s are `Serializable`, a subset of JSON.

Actors do their thing when their `ActorFn` is called. You never call an `ActorFn`, this is the job of the `Supervisor`, and it starts doing this whenever actors get something `deliver`ed to their `Mailbox`.

`ActorFn`s can be composed `usingMessageHandlers`: this way you can implement one function for each message type your actor expects. This is not mandatory, but it helps.

### Systems and Messaging

`ActorSystem`s are a collection of `Actor`s that are directly connected to each other by sharing the same `Messaging`. Actors in a system can be `query`-d or `dispatch`-ed to from the outside.

`Router`s connect multiple systems using **Transports**. If an actor's id was `publish`ed on the network, it can be reached by any actor on any of its nodes. *The implementation of remoting is currently a bit messy, and will be simplified in the following versions. Transparent remoting, as far as actors are concerned, will stay the same.*

### Actor state

`ActorFn`s can be **stateful** or **stateless**. In essence, a stateful actor is `(msg: Message, prevState: Serializable): Serializable => newState` and a stateless one is `(msg: Message) => void`.

**State**, like `Message`s is `Serializable`. Both can be stored if needed.

State storage is is handled by a `StateHandler`. *Storing `Message`s and `Event`s is a future feature that requires some rewriting*.

### Actor context

Besides state, actors have a `Context`, which is is an `AnyRecord`. Think of it as the collection of tools available to an actor, or a place to store any functionality you need to add. `context` is for 3rd party SDKs and *hacking new functionality*.
**Context** should never be stored.

### Runtime Type Safety

TypeScript coverage is great, but there's no guarantee that an actor is getting an expected type of message. *That's just how it is over networks.* There's no built-in validation, you can use your own **Validator Functions**, which are TS Type Predicates implemented with something like `ajv`, for example. `StateValidatorFn`s can be passed to `MakeStateHandler`s and `MessageValidatorFn`s to `usingMessageHandlers`.

### Actor and system "Behavior"

**Behavior**s, as used in the jargon, are not a thing in this library.

For example, `ActorState` is retrieved on actor initialization, and saved after the actor function returned with a non-`null` state. If anything went wrong during state retrieval or message processing, **the message causing the error is dropped and forgotten**. This is the default behavior. If this is not okay for you, implement a different `Supervisor`!

If you want to persist unprocessed messages, you need a new `Mailbox`.

You can implement `MakeStateHandler`s and `UniqueIdFn`s to adapt to a state (snapshot) storage solution fit for your needs.

**In the future: replace** `Messaging` **with a** `zeromq` **or Kafka-based solution, if needed.**

### Examples and documentation

Instead of having a lot of documentation, the library has [the examples](), and very verbose code.

### Next Up in 4.0-6.0

Versions are bumped often. What's coming:

- rewriting `Messaging` and `Router` as one entity (most likely also called `Messaging`)
- **dismissing** and **hierarchy**
- **logging**!
- `Event`s?

## Developing the library

The project is an `npm` monorepo. `tsdown` is used for building libs, `vitest` for testing. It's a JS thing, you know the drill.

### Scripts available in the project root

`npm run checks` to run TS checks for all packages.

`npm run tests` to run tests for all packages

`npm run builds` to build all packages

`npm run format` to format the entire repo (`js`, `ts`, `json`)

## Inspiration

Kudos to the authors of [nact](https://github.com/nactio/nact) and [comedy](https://github.com/untu/comedy), two projects which have inspired a lot of this framework, and [Akka](https://akka.io/), the documentation of which I always check whenever I feel like I'm going to do someting silly, and need some stable ground to stand on.
