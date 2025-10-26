import { ActorId, Nullable, Serializable } from 'src/types/base'
import { Message } from 'src/types/message'
import { Actor, DispatchFn } from 'src/types/system'
import { AnyRecord, AsyncOrSync } from 'src/types/util'

import { SnapshotOptions } from './persistence'

/**
 * Actors are stateful by default, think of them as functions
 * that reduce messages to a state object.
 * A stateless actor is just an actor with a `null` state.
 * The State Handler stores this state between actor calls.
 */
export type ActorStateHandler<StateType> = {
    get: () => StateType
    set: (newState: StateType) => void
}

/**
 * The (user-defined) function passed to an actor that decides
 * how to deal with a message.
 * It's passed the previous state and the parent system's `DispatchFn`
 * and must return the new state (or null, if there was no change).
 */
export type ActorFn<
    StateType extends Nullable<Serializable>,
    ContextType extends Nullable<AnyRecord>,
    MessageType extends Message = Message,
> = (
    params: {
        state: StateType
        context: ContextType
        msg: MessageType
        dispatch: DispatchFn
    }, //
) => AsyncOrSync<Nullable<StateType>>

/**
 * Actors can be spawned individually!
 * Anything goes as long as they receive a `DispatchFn`.
 * This is useful for testing and for distributed actor systems.
 */
export type SpawnFnParams<
    StateType extends Nullable<Serializable>,
    ContextType extends Nullable<AnyRecord>,
> = {
    id: ActorId
    fn: ActorFn<StateType, ContextType, any>
    dispatch: DispatchFn
    snapshots?: StateType extends Serializable
        ? SnapshotOptions<StateType>
        : never
    initialState: StateType
    context: ContextType
}
export type SpawnFn = <
    StateType extends Nullable<Serializable>,
    ContextType extends Nullable<AnyRecord>,
>(
    params: SpawnFnParams<StateType, ContextType>,
) => Actor

/**
 * ... but usually actors are spawned by an `ActorSystem`,
 * which provides its own `DispatchFn`.
 */
export type SpawnRootActorParams<
    StateType extends Nullable<Serializable>,
    ContextType extends Nullable<AnyRecord>,
> = Pick<
    SpawnFnParams<StateType, ContextType>,
    'id' | 'fn' | 'snapshots' | 'initialState' | 'context'
>

export type SpawnRootActor = <
    StateType extends Nullable<Serializable>,
    ContextType extends Nullable<AnyRecord>,
>(
    args: SpawnRootActorParams<StateType, ContextType>,
) => Actor
