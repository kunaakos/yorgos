import { Mailbox } from 'src/types/mailbox'
import { Message } from 'src/types/message'

import { cloneMessage } from 'src/util/cloneMessage'

export const initMailbox = (): Mailbox => {
    const storedMessages: Message[] = []

    const hasMessages = () => Boolean(storedMessages.length)
    const isEmpty = () => !Boolean(storedMessages.length)

    const deliver = (message: Message) => {
        storedMessages.push(cloneMessage(message))
    }

    const getOldest = (): Message => {
        if (!storedMessages.length || !storedMessages[0])
            throw new Error('No message in mailbox.')
        return cloneMessage(storedMessages[0])
    }

    const deleteOldest = () => {
        storedMessages.shift()
    }

    return {
        hasMessages,
        isEmpty,
        deliver,
        getOldest,
        deleteOldest
    }
}
