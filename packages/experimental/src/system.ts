import { ActorSystemId } from 'src/types/base'
import { ActorSystem } from 'src/types/system'

import { uniqueId } from 'src/util/uniqueId'
import { withEffect } from 'src/util/withEffect'

import { makeMailbox } from 'src/mailbox'
import { initMessaging } from 'src/messaging'
import { initQuery } from 'src/query'
import { spawnStateful, spawnStateless } from 'src/spawn'
import { makeInMemoryStateHandler } from 'src/stateHandler'
import { makeSupervisor } from 'src/supervisor'

import { partial } from './util/partial'

export const initSystem = ({
    id,
    // makePersistentStateHandler,
}: {
    id?: ActorSystemId
    // makePersistentStateHandler?: MakeStateHandler
}): ActorSystem => {
    const systemId = id || uniqueId()
    const messaging = initMessaging({ systemId })

    const query = initQuery({ messaging })

    const systemSpawnStateless: ActorSystem['spawnStateless'] = withEffect(
        messaging.connectActor,
        partial(spawnStateless, {
            makeMailbox,
            makeSupervisor,
            systemDispatch: messaging.dispatch,
        }),
    )

    const systemSpawnStateful: ActorSystem['spawnStateful'] = withEffect(
        messaging.connectActor,
        partial(spawnStateful, {
            makeMailbox,
            makeSupervisor,
            makeStateHandler: makeInMemoryStateHandler,
            systemDispatch: messaging.dispatch,
        }),
    )

    // const systemSpawnPersistent: ActorSystem['spawnPersistent'] = withEffect(
    //     messaging.connectActor,
    //     partial(spawnStateful, {
    //         makeMailbox,
    //         makeSupervisor,
    //         makeStateHandler: makePersistentStateHandler,
    //         systemDispatch: messaging.dispatch,
    //     }),
    // )

    return {
        spawnStateful: systemSpawnStateful,
        spawnStateless: systemSpawnStateless,
        // spawnPersistent: systemSpawnPersistent,
        query,
        dispatch: messaging.dispatch,
        connectRemotes: messaging.connectRemotes,
        disconnectRemotes: messaging.disconnectRemotes,
    }
}
