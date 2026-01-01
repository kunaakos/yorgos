import { ActorId, Serializable } from 'src/types/base'
import { AsyncOrSync } from 'src/types/util'

export type StateHandler<StateType extends Serializable> = {
    get: () => AsyncOrSync<StateType>
    set: (newState: StateType) => void
}

export type StateValidatorFn<StateType extends Serializable> = (
    obj: any,
) => obj is StateType

export type MakeStateHandler = <StateType extends Serializable>(args: {
    id: ActorId
    initialState: StateType
    isValidState: StateValidatorFn<StateType>
}) => StateHandler<StateType>
