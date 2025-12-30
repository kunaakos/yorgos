import { Serializable } from 'src/types/base'
import { PersistentState } from 'src/types/persistence'
import { StateHandler } from 'src/types/stateHandler.type'

import { clone } from 'src/util/clone'

// NOTE: implementation of StateValidatorFn
export const stubStateValidator = <StateType>(o: any): o is StateType => o && true

export const initInMemoryStateHandler = <StateType extends Serializable>({
    initialState,
}: {
    initialState: StateType
}): StateHandler<StateType> => {
    let state: StateType = initialState
    const get = () => clone(state)
    const set = (newState: StateType) => {
        state = newState
    }
    return {
        get,
        set,
    }
}

export const initPersistentStateHandler = async <
    StateType extends Serializable,
>({
    initialState,
    persistentState,
}: {
    initialState: StateType
    persistentState: PersistentState<StateType>
}): Promise<StateHandler<StateType>> => {
    let state: StateType = await persistentState.retrieve() || initialState

    const get = () => clone(state)
    const set = async (newState: StateType) => {
        await persistentState.store(newState)
        state = newState
    }

    return {
        get,
        set,
    }
}

export const nullStateHandler: StateHandler<null> = {
    get: () => null,
    set: () => {
        throw new Error('Stateless actor reported a state change.')
    },
}
