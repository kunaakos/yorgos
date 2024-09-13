import { ActorId, Nullable } from './base'
import { Message } from './message'
import { Actor, DispatchFn } from './system'
import { AsyncOrSync } from './util'

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
export type ActorFn<StateType, MessageType extends Message = Message> = (
    params: {
        state: StateType
        msg: MessageType
        dispatch: DispatchFn
    }, //
) => AsyncOrSync<Nullable<StateType>>

/**
 * Actors can be spawned individually!
 * Anything goes as long as they receive a `DispatchFn`.
 * This is useful for testing and for distributed actor systems.
 */
export type SpawnFnParams<StateType> = {
    id: ActorId
    fn: ActorFn<StateType, any>
    dispatch: DispatchFn
    initialState: StateType
}
export type SpawnFn = <StateType>(params: SpawnFnParams<StateType>) => Actor

/**
 * ... but usually actors are spawned by an `ActorSystem`,
 * which provides its own `DispatchFn`.
 */
export type SystemSpawnFnParams<StateType> = Pick<
    SpawnFnParams<StateType>,
    'id' | 'fn' | 'initialState'
>
export type SystemSpawnFn = <StateType>(
    args: SystemSpawnFnParams<StateType>,
) => Actor
