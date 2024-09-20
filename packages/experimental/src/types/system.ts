import { SystemSpawnFn } from 'src/types/actor'
import { ActorId } from 'src/types/base'
import { Message } from 'src/types/message'
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
}
