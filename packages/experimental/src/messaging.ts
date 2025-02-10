import { ActorId, ActorSystemId, Nullable } from 'src/types/base'
import {
    ActorConnection,
    ConnectActorFn,
    DisconnectActorFn,
    Messaging,
} from 'src/types/messaging'
import { CreateLinkFn, Downlink, Uplink } from 'src/types/remoting'
import { DispatchFn } from 'src/types/system'

export const initMessaging = ({
    systemId,
}: {
    systemId: ActorSystemId
}): Messaging => {
    const locals: Record<ActorId, ActorConnection> = {}
    let uplink: Nullable<Uplink> = null

    const dispatch: DispatchFn = (message) => {
        if (locals[message.meta.to]) {
            locals[message.meta.to]?.actor.deliver(message)
        } else if (uplink) {
            uplink.dispatch(message)
        } else {
            // TODO: handle messages without recipients
        }
    }

    const connectActor: ConnectActorFn = (actorConnection) => {
        locals[actorConnection.actor.id] = actorConnection
        if (uplink && actorConnection.isPublic) {
            uplink.publish(actorConnection.actor.id)
        }
    }

    const disconnectActor: DisconnectActorFn = ({ id }) => {
        if (locals[id]) {
            uplink && locals[id].isPublic && uplink.unpublish(id)
            delete locals[id]
        } else {
            throw new Error('Could not disconnect: ActorId not found')
        }
    }

    const connectRemotes = (createLink: CreateLinkFn) => {
        if (uplink) {
            throw new Error(
                'Cannot connect to system: remotes already connected.',
            )
        } else {
            const downlink: Downlink = {
                systemId,
                dispatch,
                onDestroyed: () => {
                    uplink = null
                },
            }
            uplink = createLink(downlink)
            Object.values(locals).forEach(
                (actorConnection) =>
                    actorConnection.isPublic &&
                    uplink?.publish(actorConnection.actor.id),
            )
        }
    }

    const disconnectRemotes = () => {
        if (!uplink) {
            throw new Error('Cannot disconnect from system: not connected.')
        } else {
            uplink.destroy()
            uplink = null
        }
    }

    return {
        connectActor,
        disconnectActor,
        connectRemotes,
        disconnectRemotes,
        dispatch,
    }
}
