import { ActorId, Serializable } from 'src/types/base'
import { MakeStateHandler, StateValidatorFn } from 'src/types/stateHandler.type'

import { clone } from 'src/util/clone'

// NOTE: implementation of StateValidatorFn
export const stubStateValidator = <StateType>(o: any): o is StateType =>
    o && true

export const makeInMemoryStateHandler: MakeStateHandler = <
    StateType extends Serializable,
>({
    id,
    initialState,
    isValidState,
}: {
    id: ActorId
    initialState: StateType
    isValidState: StateValidatorFn<StateType>
}) => {
    let state = initialState
    const get = () => clone(state)
    const set = (newState: StateType) => {
        if (!isValidState(newState))
            throw new Error(`Invalid state returned by ${id}.`)
        state = newState
    }
    return {
        get,
        set,
    }
}
