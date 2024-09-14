import { spawn } from './spawn'
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
        const actor = spawn({
            id,
            fn,
            initialState,
            dispatch: messageHub.dispatch,
        })
        messageHub.connectActor(actor)
        return actor // <- this is where the trouble lies
    }

    return {
        spawn: systemSpawnFn,
        query,
        dispatch: messageHub.dispatch,
    }
}
