import { cloneDeep } from 'lodash'
import { Message, MessageList, Nullable } from './types'

export type Mailbox = {
    hasMessages: () => boolean
    deliver: (messages: MessageList) => void
    getOldest: () => Nullable<Message>
    deleteOldest: () => void
    getAll: () => MessageList
    deleteAll: () => void
}

export const initMailbox = (): Mailbox => {
    const storedMessages: MessageList = []

    const hasMessages = () => Boolean(storedMessages.length)

    const deliver = (messages: MessageList) => {
        storedMessages.push(...messages.map(cloneDeep))
    }

    const getOldest = (): Nullable<Message> =>
        storedMessages[0] ? cloneDeep(storedMessages[0]) : null

    const deleteOldest = () => {
        storedMessages.shift()
    }

    const getAll = (): MessageList => {
        return [...storedMessages.map(cloneDeep)]
    }

    const deleteAll = () => {
        storedMessages.splice(0, storedMessages.length)
    }

    return {
        hasMessages,
        deliver,
        getOldest,
        deleteOldest,
        getAll,
        deleteAll,
    }
}
