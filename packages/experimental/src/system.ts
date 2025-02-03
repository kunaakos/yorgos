import { ActorSystem } from 'src/types/system'

import { initMessaging } from 'src/messaging'
import { initQuery } from 'src/query'
import { spawn } from 'src/spawn'

export const initSystem = (): ActorSystem => {
    const messaging = initMessaging()

    const query = initQuery({ messaging })

    /**
     * The only difference between independently spawned and "system" actors is
     * that system actors come pre-connected to a message hub,
     * which holds a reference to them so they're not garbage collected.
     *
     * NOTE: a reference to the `deliver` function returned by the `SpawnFn`
     * will keep the actor from being garbage collected.
     * This also keeps the system together.
     * I'm yet to figure out how to solve this elegantly while keeping
     * the ability to message actors directly.
     */
    const systemSpawnFn: ActorSystem['spawn'] = ({ id, fn, initialState }) => {
        const newActor = spawn({
            id,
            fn,
            initialState,
            dispatch: messaging.dispatch,
        })
        messaging.connectActor(newActor)
        return newActor // <- this is where the trouble lies
    }

    return {
        spawn: systemSpawnFn,
        query,
        dispatch: messaging.dispatch,
        connectRemote: messaging.connectRemote,
        disconnectRemote: messaging.disconnectRemote,
    }
}
