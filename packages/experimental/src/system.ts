import { ActorSystemId } from 'src/types/base'
import { Actor, ActorSystem } from 'src/types/system'

import { uniqueId } from 'src/util/uniqueId'
import { withEffect } from 'src/util/withEffect'

import { makeMailbox } from 'src/mailbox'
import { initMessaging } from 'src/messaging'
import { initQuery } from 'src/query'
import { spawnStateful, spawnStateless } from 'src/spawn'
import { makeInMemoryStateHandler } from 'src/stateHandler'
import { makeSupervisor } from 'src/supervisor'

export const initSystem = ({ id }: { id?: ActorSystemId }): ActorSystem => {
    const systemId = id || uniqueId()
    const messaging = initMessaging({ systemId })

    const query = initQuery({ messaging })

    const connectToMessaging = (actor: Actor) => messaging.connectActor(actor)

    const systemSpawnStateless: ActorSystem['spawnStateless'] = withEffect(
        connectToMessaging,
        (args) => {
            return spawnStateless({
                makeMailbox,
                makeSupervisor,
                systemDispatch: messaging.dispatch,
                ...args,
            })
        },
    )

    const systemSpawnStateful: ActorSystem['spawnStateful'] = withEffect(
        connectToMessaging,
        (args) => {
            return spawnStateful({
                makeMailbox,
                makeSupervisor,
                makeStateHandler: makeInMemoryStateHandler,
                systemDispatch: messaging.dispatch,
                ...args,
            })
        },
    )

    return {
        spawnStateful: systemSpawnStateful,
        spawnStateless: systemSpawnStateless,
        // spawnPersistent,
        query,
        dispatch: messaging.dispatch,
        connectRemotes: messaging.connectRemotes,
        disconnectRemotes: messaging.disconnectRemotes,
    }
}
