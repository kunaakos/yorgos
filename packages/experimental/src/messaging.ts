import { ActorId, ActorSystemId, Nullable } from 'src/types/base'
import {
    ConnectActorFn,
    DisconnectActorFn,
    Messaging,
} from 'src/types/messaging'
import { Downlink, LinkFn, Uplink } from 'src/types/remoting'
import { Actor, DispatchFn } from 'src/types/system'

import { eventually } from 'src/util/eventually'

export const initMessaging = ({
    systemId,
}: {
    systemId: ActorSystemId
}): Messaging => {
    const locals: Record<ActorId, Actor> = {}
    let uplink: Nullable<Uplink> = null

    /**
     * NOTE: `eventually` and non-blocking calls were not
     * throroughly though out. Should revisit this.
     * The idea is that `dispatch` calls should never block anything.
     * The supervisor handles the same for locally dispatched messages.
     */
    const dispatch: DispatchFn = (message) => {
        if (locals[message.meta.to]) {
            locals[message.meta.to]?.dispatch(message)
        } else if (uplink) {
            eventually(() => uplink && uplink.dispatch(message))()
        } else {
            // TODO: handle messages without recipients
        }
    }

    const connectActor: ConnectActorFn = (actor) => {
        locals[actor.id] = actor
        uplink && uplink.publish([actor.id])
    }

    const disconnectActor: DisconnectActorFn = ({ id }) => {
        if (locals[id]) {
            uplink && uplink.unpublish([id])
            delete locals[id]
        } else {
            throw new Error('Could not disconnect: ActorId not found')
        }
    }

    const connectRemotes = (createLink: LinkFn) => {
        if (uplink) {
            throw new Error(
                'Cannot connect to system: remotes already connected.',
            )
        } else {
            const downlink: Downlink = {
                systemId,
                dispatch,
                disconnect: () => {
                    uplink = null
                },
            }
            uplink = createLink(downlink)
            const publicIds = Object.values(locals).map((actor) => actor.id)
            uplink?.publish(publicIds)
        }
    }

    const disconnectRemotes = () => {
        if (!uplink) {
            throw new Error('Cannot disconnect from system: not connected.')
        } else {
            uplink.disconnect()
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
