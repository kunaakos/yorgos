export type StateValidatorFn<StateType> = (obj: any) => obj is StateType

export type StateHandler<StateType> = {
    get: () => StateType
    set: (newState: StateType) => void
}
