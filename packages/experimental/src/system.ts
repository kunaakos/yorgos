import { ActorSystemId } from 'src/types/base'
import { ActorSystem } from 'src/types/system'

import { uniqueId } from 'src/util/uniqueId'

import { initMessaging } from 'src/messaging'
import { initQuery } from 'src/query'
import { spawnStatefulActor, spawnStatelessActor } from 'src/spawn'

import { PersistentStateProvider } from './types/persistence'
import { stubStateValidator } from './stateHandler'

export const initSystem = ({
    id,
    persistenceProvider,
}: {
    id?: ActorSystemId
    persistenceProvider?: PersistentStateProvider
}): ActorSystem => {
    const systemId = id || uniqueId()
    const messaging = initMessaging({ systemId })

    const query = initQuery({ messaging })

    const spawnStateful: ActorSystem['spawnStateful'] = async ({
        id,
        fn,
        initialState,
        persistState = false,
        isValidState = stubStateValidator,
        context,
    }) => {
        if (!persistenceProvider)
            throw new Error(
                'Attempted to spawn an actor with persistent state without a persistence provider.',
            )
        const actor = await spawnStatefulActor({
            id,
            fn,
            initialState,
            context,
            ...(persistState
                ? { persistentState: persistenceProvider({ id, isValidState }) }
                : {}),
            dispatch: messaging.dispatch,
        })
        messaging.connectActor(actor)
        return actor
    }

    const spawnStateless: ActorSystem['spawnStateless'] = ({
        id,
        fn,
        context,
    }) => {
        const actor = spawnStatelessActor({
            id,
            fn,
            context,
            dispatch: messaging.dispatch,
        })
        messaging.connectActor(actor)
        return actor
    }

    return {
        spawnStateful,
        spawnStateless,
        query,
        dispatch: messaging.dispatch,
        connectRemotes: messaging.connectRemotes,
        disconnectRemotes: messaging.disconnectRemotes,
    }
}
