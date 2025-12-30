import { ActorId, Serializable } from 'src/types/base'
import { StateValidatorFn } from 'src/types/stateHandler.type'

export type PersistentStateProvider = <StateType extends Serializable>({
    id,
    isValidState
}: {
    id: ActorId
    isValidState: StateValidatorFn<StateType>
}) => PersistentState<StateType>


export type PersistentState<StateType> = {
    store: (newState: StateType) => Promise<void>
    retrieve: () => Promise<StateType>
}
