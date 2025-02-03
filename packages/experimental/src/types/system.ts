import { SystemSpawnFn } from 'src/types/actor'
import { ActorId } from 'src/types/base'
import { Message } from 'src/types/message'
import { ConnectRemoteFn, DisconnectRemoteFn } from 'src/types/messaging'
import { QueryFn } from 'src/types/queryFn'

/**
 * Messages are always passed in batches.
 * They hold the address of the recipient, belong to different categories,
 * as defined in `MessageMeta`.
 */
export type MessageList = Message[]

/**
 * Outgoing messages are dispatched using a `DispatchFn`.
 * Passing a correctly addressed `MessageList` to a `DispatchFn`
 * is all that's needed for delivery.
 */
export type DispatchFn = (messages: MessageList) => void

/**
 * Actor references are just a pair of ID and the actor's own `DispatchFn`.
 * Internally, they have a `Mailbox`, `StateHandler` and `Supervisor`.
 */
export type Actor = {
    id: ActorId // this is what actors can be addressed by
    deliver: DispatchFn //. as in "delivers mail to the actor"
}

/**
 * Actors live in the actor system, which:
 * - holds references to actors
 * - has a `MessageHub` that handles the distribution of messages
 * - provides the `QueryFn` and a `DispatchFn` which allow entities
 *   outside of the system to interact with actors
 * - provides a `SystemSpawnFn` that spawns actors that reside in it
 */
export type ActorSystem = {
    spawn: SystemSpawnFn
    query: QueryFn
    dispatch: DispatchFn
    /**
     * NOTE: this is starting to look like a refactor.
     * Messaging needs to be rewritten as an actor itself,
     * these two functions should be wrappers for dispatching messages.
     * The main obstacle: actor refs cannot be transmitted via messages
     * and actor state is no good place for them either
     * but introducing the `refs` container for actors would solve this
     * by allowing an actor registry to be shared between the `ActorSystem`
     * and the `Actor` that handles messaging.
     * This could lead down a path where more components of the system
     * are implemented as actors, which sounds interesting to explore 🤔
     */
    connectRemote: ConnectRemoteFn
    disconnectRemote: DisconnectRemoteFn
}
