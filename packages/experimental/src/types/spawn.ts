import { ActorFn } from 'src/types/actor'
import { ActorId, Serializable, UniqueIdFn } from 'src/types/base'
import { MakeMailbox } from 'src/types/mailbox'
import { Messaging } from 'src/types/messaging'
import { MakeStateHandler, StateValidatorFn } from 'src/types/stateHandler'
import { MakeSupervisor } from 'src/types/supervisor'
import { Actor } from 'src/types/system'
import { AnyRecord } from 'src/types/util'

export type SpawnStatefulFnArgs<
    StateType extends Serializable,
    ContextType extends AnyRecord,
> = {
    id: ActorId
    context?: ContextType
    initialState: StateType
    validator?: StateValidatorFn<StateType>
    fn: ActorFn<any, StateType, ContextType>
}

export type SpawnStatefulFn = <
    StateType extends Serializable,
    ContextType extends AnyRecord,
>(
    args: SpawnStatefulFnArgs<StateType, ContextType>,
) => Actor

export type MakeSpawnStatefulFnArgs = {
    messaging: Messaging
    makeMailbox: MakeMailbox
    makeSupervisor: MakeSupervisor
    makeStateHandler: MakeStateHandler
    uniqueId: UniqueIdFn
}

export type MakeSpawnStatefulFn = (
    args: MakeSpawnStatefulFnArgs,
) => SpawnStatefulFn

export type SpawnStatelessFnArgs<ContextType extends AnyRecord> = {
    id: ActorId
    context?: ContextType
    fn: ActorFn<any, null, ContextType>
}

export type SpawnStatelessFn = <ContextType extends AnyRecord>(
    args: SpawnStatelessFnArgs<ContextType>,
) => Actor

export type MakeSpawnStatelessFnArgs = {
    messaging: Messaging
    makeMailbox: MakeMailbox
    makeSupervisor: MakeSupervisor
    uniqueId: UniqueIdFn
}

export type MakeSpawnStatelessFn = (
    args: MakeSpawnStatelessFnArgs,
) => SpawnStatelessFn
