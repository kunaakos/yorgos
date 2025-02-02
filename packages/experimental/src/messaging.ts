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
    let router: Nullable<Actor> = null

    const dispatch: DispatchFn = (messageList) => {
        messageList.forEach((message) => {
            if (locals[message.meta.to]) {
                locals[message.meta.to]?.deliver([message])
            } else {
                router && router.deliver([message])
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

    const connectRouter = ({ actor }: { actor: Actor }) => {
        if (!router) {
            router = actor
        } else {
            throw new Error('A router is already connected.')
        }
    }

    const disconnectRouter = () => {
        router = null
    }

    return {
        connectActor,
        disconnectActor,
        connectRouter,
        disconnectRouter,
        dispatch,
    }
}
