import { ActorId } from 'src/types/base'
import {
    ConnectActorFn,
    DisconnectActorFn,
    LocalConnection,
    MessageHub,
} from 'src/types/messageHub'
import { DispatchFn } from 'src/types/system'

export const initMessageHub = (): MessageHub => {
    const locals: Record<ActorId, LocalConnection> = {}

    const addLocal = (id: ActorId, deliver: DispatchFn) => {
        locals[id] = { deliver }
    }
    const removeLocal = (id: ActorId) => {
        delete locals[id]
    }

    const dispatch: DispatchFn = (messageList) => {
        messageList.forEach((message) => {
            locals[message.meta.to]?.deliver([message])
        })
    }

    const connectActor: ConnectActorFn = ({ id, deliver }) => {
        addLocal(id, deliver)
    }

    const disconnectActor: DisconnectActorFn = ({ id }) => {
        removeLocal(id)
    }

    return {
        connectActor,
        disconnectActor,
        dispatch,
    }
}
