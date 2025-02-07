import { ActorId, ActorSystemId } from 'src/types/base'
import { RemoteLink, Router, SystemLink } from 'src/types/remoting'
import { DispatchFn } from 'src/types/system'

import { mapGetOrThrow } from 'src/util/mapGetOrThrow'

export const initRouter = (): Router => {
    const systems: Map<ActorSystemId, SystemLink & { actors: Set<ActorId> }> =
        new Map()
    const actorLocations: Map<ActorId, ActorSystemId> = new Map()

    const dispatch: DispatchFn = //
        (message) =>
            mapGetOrThrow(
                systems,
                mapGetOrThrow(
                    actorLocations,
                    message.meta.to,
                    'Router error: ActorId not found.',
                ),
                'Router error: SystemLink missing.',
            ).dispatch(message)

    const makeJoinFn: (remoteSystemId: ActorSystemId) => RemoteLink['join'] =  //
        (remoteSystemId) => (actorId) => {
            mapGetOrThrow(
                systems,
                remoteSystemId,
                'Router error: SystemLink missing',
            ).actors.add(actorId)
            actorLocations.set(actorId, remoteSystemId)
        }

    const makeLeaveFn: (remoteSystemId: ActorSystemId) => RemoteLink['leave'] =  //
        (remoteSystemId) => (actorId) => {
            mapGetOrThrow(
                systems,
                remoteSystemId,
                'Router error: SystemLink missing',
            ).actors.delete(actorId)
            actorLocations.delete(actorId)
        }

    const destroyLink = //
        (remoteSystemId: ActorSystemId) => {
            // unpublish all addresses of link
            mapGetOrThrow(
                systems,
                remoteSystemId,
                'Cannot unlink system: not linked.',
            ).actors.forEach((actorId) => actorLocations.delete(actorId))
            // delete link
            systems.delete(remoteSystemId)
        }

    const createLink: Router['createLink'] = //
        ({ systemId, dispatch: systemDispatch }) => {
            if (systems.has(systemId))
                throw new Error('Cannot link system: ActorSystemId collision.')
            systems.set(systemId, {
                systemId,
                dispatch: systemDispatch,
                actors: new Set(),
            })

            return {
                dispatch,
                join: makeJoinFn(systemId),
                leave: makeLeaveFn(systemId),
                destroy: () => {
                    destroyLink(systemId)
                },
            }
        }

    return {
        createLink,
        destroyLink,
    }
}
