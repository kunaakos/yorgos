import { Id, MessageList } from './types'

export type DispatchFn = (messages: MessageList) => void
export type ConnectActorFn = (args: { id: Id; deliver: DispatchFn }) => void
export type DisconnectActorFn = (args: { id: Id }) => void

export type MessageHub = {
    dispatch: DispatchFn
    connectActor: ConnectActorFn
    disconnectActor: DisconnectActorFn
}

export type LocalConnection = {
    deliver: DispatchFn
}

export const initMessageHub = (): MessageHub => {
    const locals: Record<Id, LocalConnection> = {}

    const addLocal = (id: Id, deliver: DispatchFn) => {
        locals[id] = { deliver }
    }
    const removeLocal = (id: Id) => {
        delete locals[id]
    }

    const dispatch: DispatchFn = (messageList) => {
        messageList.forEach((message) => {
            locals[message.to]?.deliver([message])
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
