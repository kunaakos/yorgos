import { ActorId, ActorSystemId } from 'src/types/base'
import { RemoteLink, Router, SystemLink } from 'src/types/remoting'
import { DispatchFn } from 'src/types/system'

import { map } from 'src/util/mapAndSetUtils'

/**
 * This router creates a simple star topology
 * ActorSystems or transports can be connected to it.
 *
 * NOTE: on Id collisions and error handling
 *
 * This `DispatchFn` does not throw,
 * so it doesn't interfere with `Messaging` or transport implementations.
 *
 * The rest of functions will throw ruthlessly
 * and should crash the system/transport.
 * This is preferable to bugs caused by duplicate IDs
 * or misbehaving transport implementations.
 *
 * If IDs are set manually (which has its purposes for now),
 * they should be managed carefuly, and that shouldn't be
 * the responsibility of the system.
 */

export const initRouter = (): Router => {
    const systems: Map<ActorSystemId, SystemLink & { actors: Set<ActorId> }> =
        new Map()
    const actorLocations: Map<ActorId, ActorSystemId> = new Map()

    const dispatch: DispatchFn = //
        (message) => {
            try {
                map.get(
                    systems,
                    map.get(
                        actorLocations,
                        message.meta.to,
                        'Router error: ActorId not found, message discarded.',
                    ),
                    'Router error: SystemLink missing.',
                ).dispatch(message)
            } catch (error) {
                //@ts-expect-error
                console.warn(error.message)
            }
        }

    const makeJoinFn: (remoteSystemId: ActorSystemId) => RemoteLink['join'] =  //
        (remoteSystemId) => (actorId) => {
            if (actorLocations.has(actorId))
                throw new Error('Router error: ActorId collision.')
            map.get(
                systems,
                remoteSystemId,
                'Router error: cannot join, SystemLink missing',
            ).actors.add(actorId)
            actorLocations.set(actorId, remoteSystemId)
        }

    const makeLeaveFn: (remoteSystemId: ActorSystemId) => RemoteLink['leave'] =  //
        (remoteSystemId) => (actorId) => {
            map.get(
                systems,
                remoteSystemId,
                'Router error: cannot leave, SystemLink missing',
            ).actors.delete(actorId)
            actorLocations.delete(actorId)
        }

    const destroyLink = //
        (remoteSystemId: ActorSystemId) => {
            // unpublish all addresses of link
            map.get(
                systems,
                remoteSystemId,
                'Router error: cannot destroy link, SystemLink missing.',
            ).actors.forEach((actorId) => actorLocations.delete(actorId))
            // delete link
            systems.delete(remoteSystemId)
        }

    const createLink: Router['createLink'] = //
        ({ systemId, dispatch: systemDispatch }) => {
            map.setIfNotPresent(
                systems,
                systemId,
                {
                    systemId,
                    dispatch: systemDispatch,
                    actors: new Set(),
                },
                'Router error: cannot link system, ActorSystemId collision.',
            )

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
