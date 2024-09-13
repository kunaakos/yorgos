import { cloneMessage } from './util/cloneMessage'
import { Mailbox } from './types/system'
import { Message } from './types/message'
import { Nullable } from './types/base'
import { MessageList } from './types/system'

export const initMailbox = (): Mailbox => {
    const storedMessages: MessageList = []

    const hasMessages = () => Boolean(storedMessages.length)

    const deliver = (messages: MessageList) => {
        storedMessages.push(...messages.map(cloneMessage))
    }

    const getOldest = (): Nullable<Message> =>
        storedMessages[0] ? cloneMessage(storedMessages[0]) : null

    const deleteOldest = () => {
        storedMessages.shift()
    }

    const getAll = (): MessageList => {
        return [...storedMessages.map(cloneMessage)]
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
