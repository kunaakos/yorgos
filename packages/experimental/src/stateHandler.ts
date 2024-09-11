export type StateHandler<StateType> = {
    get: () => StateType
    set: (newState: StateType) => void
}

type InitStateHandlerArgs<StateType> = {
    initialState: StateType
}

export const initStateHandler = <StateType>({
    initialState,
}: InitStateHandlerArgs<StateType>): StateHandler<StateType> => {
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
