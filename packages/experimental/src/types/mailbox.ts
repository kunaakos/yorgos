import { Message } from './message'
import { MessageList } from './system'

export type Mailbox = {
    hasMessages: () => boolean
    isEmpty: () => boolean
    deliver: (messages: MessageList) => void
    getOldest: () => Message
    deleteOldest: () => void
    getAll: () => MessageList
    deleteAll: () => void
}
