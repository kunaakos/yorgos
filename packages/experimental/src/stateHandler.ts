import { ActorStateHandler } from './types/actor'

export const initStateHandler = <StateType = any>({
    initialState,
}: {
    initialState: StateType
}): ActorStateHandler<StateType> => {
    let state: StateType = initialState
    const get = () => ({ ...state })
    const set = (newState: StateType) => {
        state = { ...newState }
    }
    return {
        get,
        set,
    }
}
