import 'src/types/actor'
import { ActorId } from 'src/types/base'
import { Message } from 'src/types/message'
import { ConnectRemotesFn, DisconnectRemotesFn } from 'src/types/messaging'
import { QueryFn } from 'src/types/queryFn'
import { SpawnStatefulFn, SpawnStatelessFn } from 'src/types/spawn'

/**
 * Outgoing messages are dispatched using a `DispatchFn`.
 * Passing a correctly addressed `Message` to a `DispatchFn`
 * is all that's needed for delivery.
 */
export type DispatchFn = (message: Message) => void

/**
 * Actor references are just a pair of ID and the actor's own `DispatchFn`.
 * Internally, they have a `Mailbox`, `StateHandler` and `Supervisor`.
 */
export type Actor = {
    id: ActorId // this is what actors can be addressed by
    dispatch: DispatchFn // deliver messages directly to the actor's mailbox
}

/**
 * Actors live in an actor system, which:
 * - holds references to actors
 * - has a `Messaging` that handles the distribution of messages
 * - provides the `QueryFn` and a `DispatchFn` which allow entities
 *   outside of the system to interact with actors
 * - provides a `spawn*` functions that spawn actors connected to it
 * This system is merely a template, custom systems can be composed.
 */
export type ActorSystem = {
    spawnStateless: SpawnStatelessFn
    spawnStateful: SpawnStatefulFn
    spawnPersistent: SpawnStatefulFn
    query: QueryFn
    dispatch: DispatchFn
    connectRemotes: ConnectRemotesFn
    disconnectRemotes: DisconnectRemotesFn
}
