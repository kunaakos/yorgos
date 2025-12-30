import { ActorId, Nullable, Serializable } from 'src/types/base'
import { Message } from 'src/types/message'
import { PersistentState } from 'src/types/persistence'
import { Actor, DispatchFn } from 'src/types/system'
import { AnyRecord, AsyncOrSync } from 'src/types/util'

export type ActorFn<
    StateType extends Nullable<Serializable>,
    ContextType extends AnyRecord,
    MessageType extends Message = Message,
> = (
    params: {
        state: StateType
        context: ContextType
        msg: MessageType
        dispatch: DispatchFn
    }, //
) => AsyncOrSync<Nullable<StateType>>

export type SharedSpawnFnParams<ContextType extends AnyRecord> = {
    id: ActorId
    dispatch: DispatchFn
    context: ContextType
}

export type SpawnStatelessActorFnParams<ContextType extends AnyRecord> =
    SharedSpawnFnParams<ContextType> & {
        fn: ActorFn<null, ContextType, any>
    }

export type SpawnStatelessActorFn = <ContextType extends AnyRecord>(
    args: SpawnStatelessActorFnParams<ContextType>,
) => Actor

export type SystemSpawnStatelessActorFn = <ContextType extends AnyRecord>(
    args: Omit<
        SpawnStatelessActorFnParams<ContextType>,
        'dispatch'
    >,
) => Actor

export type SpawnStatefulActorFnParams<
    StateType extends Serializable,
    ContextType extends AnyRecord,
> = SharedSpawnFnParams<ContextType> & {
    fn: ActorFn<StateType, ContextType, any>
    persistentState?: PersistentState<StateType>
    isValidState?: (obj: any) => obj is StateType
    initialState: StateType
}

export type SpawnStatefulActorFn = <
    StateType extends Serializable,
    ContextType extends AnyRecord,
>(
    args: SpawnStatefulActorFnParams<StateType, ContextType>,
) => Promise<Actor>

export type SystemSpawnStatefulFn = <
    StateType extends Serializable,
    ContextType extends AnyRecord,
>(
    args: Omit<
        SpawnStatefulActorFnParams<StateType, ContextType>,
        'persistentState' | 'dispatch'
    > & { persistState?: boolean },
) => Promise<Actor>
