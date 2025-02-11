import { ActorId, ActorSystemId } from 'src/types/base'
import { Downlink, Router, Uplink } from 'src/types/remoting'
import { DispatchFn } from 'src/types/system'

import { createKillswitch } from 'src/util/killswitch'
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
 * The router destroys connections on any type of id collision.
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
        {
            downlink: Downlink
            actors: Set<ActorId>
            killUplink: () => void
        }
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
                // TODO: trace/warn when logging is added
            }
        }

    const makeJoinFn: (remoteSystemId: ActorSystemId) => Uplink['publish'] =  //
        (remoteSystemId) => (publishedActorIds) => {
            const connection = map.get(
                connections,
                remoteSystemId,
                'Router error: cannot join, SystemLink missing',
            )
            if (publishedActorIds.some((id) => actorLocations.has(id))) {
                // ActorId collision, disconnect the link
                makeDestroyFn(remoteSystemId)()
                // TODO: warn when logging is added
            } else {
                connection.actors = connection.actors.union(
                    new Set(publishedActorIds),
                )
                publishedActorIds.forEach((id) => {
                    actorLocations.set(id, remoteSystemId)
                })
            }
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
            const connection = map.get(
                connections,
                remoteSystemId,
                'Router error: cannot destroy link, SystemLink missing.',
            )
            connection.killUplink()
            connection.actors.forEach((id) => {
                actorLocations.delete(id)
            })
            connections.delete(remoteSystemId)
            connection.downlink.onDestroyed()
        }

    const createLink: Router['createLink'] = //
        (downlink) => {
            const killswitch = createKillswitch({ silent: true })

            map.setIfNotPresent(
                connections,
                downlink.systemId,
                {
                    downlink,
                    actors: new Set() as Set<ActorId>,
                    killUplink: killswitch.engage,
                },
                'Router error: cannot link system, ActorSystemId collision.',
            )

            const uplink: Uplink = {
                dispatch: killswitch.wrap(dispatch),
                publish: killswitch.wrap(makeJoinFn(downlink.systemId)),
                unpublish: killswitch.wrap(makeLeaveFn(downlink.systemId)),
                destroy: killswitch.wrap(makeDestroyFn(downlink.systemId)),
            }

            return uplink
        }

    return {
        createLink,
    }
}
