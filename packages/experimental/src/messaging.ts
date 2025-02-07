import { ActorId, Nullable } from 'src/types/base'
import {
    ActorConnection,
    ConnectActorFn,
    DisconnectActorFn,
    Messaging,
} from 'src/types/messaging'
import { CreateLinkFn, RemoteLink } from 'src/types/remoting'
import { DispatchFn } from 'src/types/system'

export const initMessaging = (): Messaging => {
    const locals: Record<ActorId, ActorConnection> = {}
    let remoteLink: Nullable<RemoteLink> = null

    const dispatch: DispatchFn = (messageList) => {
        messageList.forEach((message) => {
            if (locals[message.meta.to]) {
                locals[message.meta.to]?.deliver([message])
            } else if (remoteLink) {
                remoteLink.dispatch([message])
            } else {
                // TODO: handle messages without recipients
            }
        })
    }

    const connectActor: ConnectActorFn = ({ actor, isPublic }) => {
        locals[actor.id] = { ...actor, ...(isPublic ? { isPublic: true } : {}) }
        if (remoteLink && isPublic) {
            remoteLink.join(actor.id)
        }
    }

    const disconnectActor: DisconnectActorFn = ({ id }) => {
        if (locals[id]) {
            remoteLink && locals[id].isPublic && remoteLink.leave(id)
            delete locals[id]
        } else {
            throw new Error('Could not disconnect: ActorId not found')
        }
    }

    const connectRemotes = (createLink: CreateLinkFn) => {
        if (remoteLink) {
            throw new Error(
                'Cannot connect to system: remotes already connected.',
            )
        } else {
            remoteLink = createLink({ systemId: 'todo', dispatch })
        }
    }

    const disconnectRemotes = () => {
        if (!remoteLink) {
            throw new Error('Cannot disconnect from system: not connected.')
        } else {
            remoteLink.destroy()
            remoteLink = null
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
