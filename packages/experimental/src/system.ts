import { spawnActor } from './actor'
import { initMessageHub } from './messageHub'
import { initQuery } from './query'
import { ActorSystem } from './types/system'

export const initSystem = (): ActorSystem => {
    const messageHub = initMessageHub()

    const query = initQuery({
        dispatch: messageHub.dispatch,
        connectActor: messageHub.connectActor,
        disconnectActor: messageHub.disconnectActor,
    })

    const spawn: ActorSystem['spawn'] = ({ id, fn, initialState }) => {
        const actor = spawnActor({
            id,
            fn,
            initialState,
            dispatch: messageHub.dispatch,
        })
        messageHub.connectActor(actor)
        return actor
    }

    return {
        spawn,
        query,
        dispatch: messageHub.dispatch,
    }
}
