import { ActorSystemId } from 'src/types/base'
import { MakeStateHandler } from 'src/types/stateHandler.type'
import { ActorSystem } from 'src/types/system'

import { uniqueId } from 'src/util/uniqueId'

import { makeMailbox } from 'src/mailbox'
import { initMessaging } from 'src/messaging'
import { makeQuery } from 'src/query'
import { makeSpawnStateful, makeSpawnStateless } from 'src/spawn'
import { makeInMemoryStateHandler } from 'src/stateHandler'
import { makeSupervisor } from 'src/supervisor'

export const makeSystem = ({
    id,
    makePersistentStateHandler,
}: {
    id?: ActorSystemId
    makePersistentStateHandler?: MakeStateHandler
}): ActorSystem => {
    const systemId = id || uniqueId()
    const messaging = initMessaging({ systemId })
    const query = makeQuery({ messaging })

    return {
        spawnStateful: makeSpawnStateful({
            messaging,
            makeMailbox,
            makeSupervisor,
            makeStateHandler: makeInMemoryStateHandler,
        }),
        spawnStateless: makeSpawnStateless({
            messaging,
            makeMailbox,
            makeSupervisor,
        }),
        spawnPersistent: makePersistentStateHandler
            ? makeSpawnStateful({
                  messaging,
                  makeMailbox,
                  makeSupervisor,
                  makeStateHandler: makePersistentStateHandler,
              })
            : () => {
                  throw new Error(
                      "`makePersistentStateHandler` was not passed to `initSystem`, can't spawn persistent actor.",
                  )
              },
        query,
        dispatch: messaging.dispatch,
        connectRemotes: messaging.connectRemotes,
        disconnectRemotes: messaging.disconnectRemotes,
    }
}
