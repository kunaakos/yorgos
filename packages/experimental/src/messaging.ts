import { ActorId, Nullable } from 'src/types/base'
import {
    ActorConnection,
    ConnectActorFn,
    DisconnectActorFn,
    Messaging,
} from 'src/types/messaging'
import { Actor, DispatchFn } from 'src/types/system'

export const initMessaging = (): Messaging => {
    const locals: Record<ActorId, ActorConnection> = {}
    let remote: Nullable<Actor> = null

    const dispatch: DispatchFn = (messageList) => {
        messageList.forEach((message) => {
            if (locals[message.meta.to]) {
                locals[message.meta.to]?.deliver([message])
            } else if (remote) {
                remote.deliver([message])
            } else {
                // TODO: handle messages without recipients
            }
        })
    }

    const publish = (id: ActorId) => {
        throw new Error(`cannot publish ${id}: not implemented`)
    }
    const unpublish = (id: ActorId) => {
        throw new Error(`cannot publish ${id}: not implemented`)
    }

    const connectActor: ConnectActorFn = (actorConnection) => {
        locals[actorConnection.id] = actorConnection
        if (actorConnection.isPublic) {
            publish(actorConnection.id)
        }
    }

    const disconnectActor: DisconnectActorFn = ({ id }) => {
        if (locals[id]) {
            locals[id].isPublic && unpublish(id)
            delete locals[id]
        } else {
            throw new Error('Could not disconnect: ActorId not found')
        }
    }

    const connectRemote = ({ actor }: { actor: Actor }) => {
        if (!remote) {
            remote = actor
        } else {
            throw new Error('A Remote is already connected.')
        }
    }

    const disconnectRemote = () => {
        remote = null
    }

    return {
        connectActor,
        disconnectActor,
        connectRemote,
        disconnectRemote,
        dispatch,
    }
}
