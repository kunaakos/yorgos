import { ActorId, ActorSystemId } from 'src/types/base'
import { Downlink, Router, Uplink } from 'src/types/remoting'
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
    const connections: Map<
        ActorSystemId,
        { downlink: Downlink; actors: Set<ActorId> }
    > = new Map()
    const actorLocations: Map<ActorId, ActorSystemId> = new Map()

    const dispatch: DispatchFn = //
        (message) => {
            try {
                map.get(
                    connections,
                    map.get(
                        actorLocations,
                        message.meta.to,
                        'Router error: ActorId not found, message discarded.',
                    ),
                    'Router error: SystemLink missing.',
                ).downlink.dispatch(message)
            } catch (error) {
                //@ts-expect-error
                console.warn(error.message)
            }
        }

    const makeJoinFn: (remoteSystemId: ActorSystemId) => Uplink['publish'] =  //
        (remoteSystemId) => (publishedActorIds) => {
            if (
                publishedActorIds.some((id) =>
                    actorLocations.has(id),
                )
            )
                throw new Error('Router error: ActorId collision.')
            const connection = map.get(
                connections,
                remoteSystemId,
                'Router error: cannot join, SystemLink missing',
            )
            connection.actors = connection.actors.union(new Set(publishedActorIds))
            publishedActorIds.forEach((id) => {
                actorLocations.set(id, remoteSystemId)
            })
        }

    const makeLeaveFn: (remoteSystemId: ActorSystemId) => Uplink['unpublish'] =  //
        (remoteSystemId) => (unpublishedActorIds) => {
            const connection = map.get(
                connections,
                remoteSystemId,
                'Router error: cannot leave, SystemLink missing',
            )
            connection.actors = connection.actors.difference(
                new Set(unpublishedActorIds),
            )
            unpublishedActorIds.forEach((id) => {
                actorLocations.delete(id)
            })
        }

    const makeDestroyFn: (remoteSystemId: ActorSystemId) => Uplink['destroy'] =  //
        (remoteSystemId) => () => {
            const connecion = map.get(
                connections,
                remoteSystemId,
                'Router error: cannot destroy link, SystemLink missing.',
            )
            connecion.actors.forEach((id) => {
                actorLocations.delete(id)
            })
            connections.delete(remoteSystemId)
            connecion.downlink.onDestroyed()
        }

    const createLink: Router['createLink'] = //
        (downlink) => {
            map.setIfNotPresent(
                connections,
                downlink.systemId,
                {
                    downlink,
                    actors: new Set(),
                },
                'Router error: cannot link system, ActorSystemId collision.',
            )

            return {
                dispatch,
                publish: makeJoinFn(downlink.systemId),
                unpublish: makeLeaveFn(downlink.systemId),
                destroy: makeDestroyFn(downlink.systemId),
            }
        }

    return {
        createLink,
    }
}
