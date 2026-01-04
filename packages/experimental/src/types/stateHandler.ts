import { ActorId, Nullable, Serializable } from 'src/types/base'
import { AsyncOrSync } from 'src/types/util'

export type StateHandler<StateType extends Serializable> = {
    get: () => AsyncOrSync<StateType>
    set: (newState: StateType) => void
}

export type StateValidatorFn<StateType extends Serializable> = (
    obj: any,
) => obj is StateType

export type MakeStateHandlerArgs<StateType extends Serializable> = {
    id: ActorId
    initialState: StateType
    validator: Nullable<StateValidatorFn<StateType>>
}

export type MakeStateHandler = <StateType extends Serializable>(
    args: MakeStateHandlerArgs<StateType>,
) => StateHandler<StateType>
