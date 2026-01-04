import { Serializable } from 'src/types/base'
import { MakeStateHandler, MakeStateHandlerArgs } from 'src/types/stateHandler'

import { clone } from 'src/util/clone'

export const makeInMemoryStateHandler: MakeStateHandler = <
    StateType extends Serializable,
>({
    id,
    initialState,
    validator,
}: MakeStateHandlerArgs<StateType>) => {
    let state = initialState
    const get = () => clone(state)
    const set = (newState: any) => {
        if (validator && !validator(newState))
            throw new Error(`Invalid state returned by ${id}.`)
        state = newState
    }
    return {
        get,
        set,
    }
}
