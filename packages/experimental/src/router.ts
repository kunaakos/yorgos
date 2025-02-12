import { ActorId, ActorSystemId } from 'src/types/base'
import { Downlink, LinkFn, Router, Uplink } from 'src/types/remoting'
import { DispatchFn } from 'src/types/system'

import { createKillswitch } from 'src/util/killswitch'

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

type System = {
    downLink: Downlink
    actors: Set<ActorId>
    killUplink: () => void
}

type Systems = Map<ActorSystemId, System>
type Actors = Map<ActorId, System>

export const initRouter = (): Router => {
    const systems: Systems = new Map()
    const actorLocations: Actors = new Map()

    const dispatch: DispatchFn = (message) => {
        const system = actorLocations.get(message.meta.to)
        if (!system) return
        system.downLink.dispatch(message)
    }

    const publish = (system: System, actorIds: ActorId[]) => {
        if (actorIds.some((id) => actorLocations.has(id))) {
            unlink(system)
        } else {
            system.actors = system.actors.union(new Set(actorIds))
            actorIds.forEach((id) => {
                actorLocations.set(id, system)
            })
        }
    }

    const unpublish = (system: System, actorIds: ActorId[]) => {
        system.actors = system.actors.difference(new Set(actorIds))
        actorIds.forEach((id) => {
            actorLocations.delete(id)
        })
    }

    const remove = (system: System) => {
        system.actors.forEach((id) => {
            actorLocations.delete(id)
        })
        systems.delete(system.downLink.systemId)
    }

    const unlink = (system: System) => {
        system.killUplink()
        remove(system)
        system.downLink.disconnect()
    }

    const onDisconnected = (system: System) => {
        system.killUplink()
        remove(system)
    }

    const link: LinkFn = (downlink) => {
        if (systems.has(downlink.systemId)) {
            downlink.disconnect()
            return null
        }

        /**
         * TODO: rethink Killswitch an Uplink/Downlink
         * If I keep rolling my own solution for this,
         * which is starting to look like some sort of event bus,
         * there should be a util that builds the links with
         * all necessary functionality built in
         * to be used for implementing transports and remote systems.
         */
        const ks = createKillswitch({ silent: true })

        const system = {
            downLink: downlink,
            actors: new Set() as Set<ActorId>,
            killUplink: ks.engage,
        }
        systems.set(downlink.systemId, system)

        const uplink: Uplink = {
            dispatch: ks.wrap(dispatch),
            publish: ks.wrap((ids: ActorId[]) => publish(system, ids)),
            unpublish: ks.wrap((ids: ActorId[]) => unpublish(system, ids)),
            disconnect: ks.wrap(() => onDisconnected(system)),
        }

        return uplink
    }

    return {
        link,
    }
}
