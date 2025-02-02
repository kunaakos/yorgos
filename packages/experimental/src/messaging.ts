import { ActorId, Nullable } from 'src/types/base'
import {
    ConnectActorFn,
    DisconnectActorFn,
    LocalConnection,
    Messaging,
    RemoteConnection,
} from 'src/types/messaging'
import { Actor, DispatchFn } from 'src/types/system'

export const initMessaging = (): Messaging => {
    const locals: Record<ActorId, LocalConnection> = {}
    const remotes: Record<ActorId, RemoteConnection> = {}
    let connectedRouter: Nullable<Actor> = null

    const dispatch: DispatchFn = (messageList) => {
        messageList.forEach((message) => {
            if (locals[message.meta.to]) {
                locals[message.meta.to]?.deliver([message])
            } else if (remotes[message.meta.to]) {
                connectedRouter && connectedRouter.deliver([message])
            } else {
                // message is discarded
                // TODO: log unknown address
            }
        })
    }

    const publish = (id: ActorId) => {
        throw new Error(`cannot publish ${id}: not implemented`)
    }
    const unpublish = (id: ActorId) => {
        throw new Error(`cannot publish ${id}: not implemented`)
    }

    const connectLocalActor: ConnectActorFn = ({ id, deliver, isPublic }) => {
        locals[id] = {
            deliver, //
            isPublic: isPublic || false, //
        }
        if (isPublic) {
            publish(id)
        }
    }

    const disconnectLocalActor: DisconnectActorFn = ({ id }) => {
        if (locals[id]) {
            locals[id].isPublic && unpublish(id)
            delete locals[id]
        } else {
            throw new Error('Could not disconnect: ActorId not found')
        }
    }

    const connectRouter = ({ router }: { router: Actor }) => {
        if (!connectedRouter) {
            connectedRouter = router
        } else {
            throw new Error('A router is already connected.')
        }
    }
    const disconnectRouter = () => {
        connectedRouter = null
    }

    return {
        connectActor: connectLocalActor,
        disconnectActor: disconnectLocalActor,
        connectRouter,
        disconnectRouter,
        dispatch,
    }
}
