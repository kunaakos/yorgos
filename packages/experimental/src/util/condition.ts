type Condition = {
    is: (value: boolean) => boolean
    set: (newValue: boolean) => void
    toggle: () => void
    doIf: (value: boolean, callback: () => void) => () => void
    toggleAndDoIf: (value: boolean, callback: () => void) => () => void
}

export const condition = (initialState: boolean): Condition => {
    let state: boolean = initialState
    const toggleState = () => (state = !state)
    return {
        is: (value) => state === value,
        set: (newValue) => {
            state = newValue
        },
        toggle: () => {
            toggleState()
        },
        doIf: (value, callback) => () => {
            if (state === value) callback()
        },
        toggleAndDoIf: (value, callback) => () => {
            if (state === value) {
                toggleState()
                callback()
            }
        },
    }
}
