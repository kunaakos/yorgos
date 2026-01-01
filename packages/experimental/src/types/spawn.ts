import { ActorFn } from 'src/types/actor'
import { ActorId, Serializable } from 'src/types/base'
import { MakeMailbox } from 'src/types/mailbox'
import { MakeStateHandler, StateValidatorFn } from 'src/types/stateHandler.type'
import { MakeSupervisor } from 'src/types/supervisor'
import { Actor, DispatchFn } from 'src/types/system'
import { AnyRecord } from 'src/types/util'

type SpawnFnArgs<ContextType extends AnyRecord> = {
    systemDispatch: DispatchFn
    makeMailbox: MakeMailbox
    makeSupervisor: MakeSupervisor
    id: ActorId
    context: ContextType
}
export type StatefulSpawnFn = <
    StateType extends Serializable,
    ContextType extends AnyRecord,
>(
    args: SpawnFnArgs<ContextType> & {
        makeStateHandler: MakeStateHandler
        initialState: StateType
        isValidState: StateValidatorFn<StateType>
        fn: ActorFn<StateType, ContextType, any>
    },
) => Actor

export type StatelessSpawnFn = <ContextType extends AnyRecord>(
    args: SpawnFnArgs<ContextType> & {
        fn: ActorFn<null, ContextType, any>
    },
) => Actor
