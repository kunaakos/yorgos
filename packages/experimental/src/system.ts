import { ActorSystem } from 'src/types/system'

import { initMessaging } from 'src/messaging'
import { initQuery } from 'src/query'
import { spawn } from 'src/spawn'

import { ActorSystemId } from './types/base'
import { uniqueId } from './util/uniqueId'

export const initSystem = ({ id }: { id?: ActorSystemId }): ActorSystem => {
    const systemId = id || uniqueId()
    const messaging = initMessaging({ systemId })

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
    const systemSpawnFn: ActorSystem['spawn'] = ({
        id,
        fn,
        initialState,
        isPublic = false,
    }) => {
        const newActor = spawn({
            id,
            fn,
            isPublic,
            initialState,
            dispatch: messaging.dispatch,
        })
        messaging.connectActor({ actor: newActor, isPublic })
        return newActor // <- this is where the trouble lies
    }

    return {
        spawn: systemSpawnFn,
        query,
        dispatch: messaging.dispatch,
        connectRemotes: messaging.connectRemotes,
        disconnectRemotes: messaging.disconnectRemotes,
    }
}
