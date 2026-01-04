import { ActorSystemId, UniqueIdFn } from 'src/types/base'
import { MakeMailbox } from 'src/types/mailbox'
import { MakeStateHandler } from 'src/types/stateHandler'
import { MakeSupervisor } from 'src/types/supervisor'
import { ActorSystem } from 'src/types/system'

import { uuidV7 } from 'src/util/uniqueId'

import { makeMailbox as makeDefaultMailbox } from 'src/mailbox'
import { initMessaging } from 'src/messaging'
import { makeQuery } from 'src/query'
import { makeSpawnStateful, makeSpawnStateless } from 'src/spawn'
import { makeInMemoryStateHandler } from 'src/stateHandler'
import { makeSupervisor as makeDefaultSupervisor } from 'src/supervisor'

export const makeSystem = ({
    id,
    makeMailbox = makeDefaultMailbox,
    makeSupervisor = makeDefaultSupervisor,
    makePersistentStateHandler,
    uniqueId = uuidV7,
}: {
    id?: ActorSystemId
    makeMailbox?: MakeMailbox
    makeSupervisor?: MakeSupervisor
    makePersistentStateHandler?: MakeStateHandler
    uniqueId?: UniqueIdFn
} = {}): ActorSystem => {
    const systemId = id || uniqueId()
    const messaging = initMessaging({ systemId })
    const query = makeQuery({ messaging, uniqueId })

    return {
        spawnStateful: makeSpawnStateful({
            messaging,
            makeMailbox,
            makeSupervisor,
            makeStateHandler: makeInMemoryStateHandler,
            uniqueId,
        }),
        spawnStateless: makeSpawnStateless({
            messaging,
            makeMailbox,
            makeSupervisor,
            uniqueId,
        }),
        spawnPersistent: makePersistentStateHandler
            ? makeSpawnStateful({
                  messaging,
                  makeMailbox,
                  makeSupervisor,
                  makeStateHandler: makePersistentStateHandler,
                  uniqueId,
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
