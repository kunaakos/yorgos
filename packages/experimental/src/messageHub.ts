import { ActorId, MessageList } from './types'

export type DispatchFn = (messages: MessageList) => void
export type ConnectActorFn = (args: {
    id: ActorId
    deliver: DispatchFn
}) => void
export type DisconnectActorFn = (args: { id: ActorId }) => void

export type MessageHub = {
    dispatch: DispatchFn
    connectActor: ConnectActorFn
    disconnectActor: DisconnectActorFn
}

export type LocalConnection = {
    deliver: DispatchFn
}

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
