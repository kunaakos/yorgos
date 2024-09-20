import { Message } from 'src/types/message'
import { MessageList } from 'src/types/system'

export type Mailbox = {
    hasMessages: () => boolean
    isEmpty: () => boolean
    deliver: (messages: MessageList) => void
    getOldest: () => Message
    deleteOldest: () => void
    getAll: () => MessageList
    deleteAll: () => void
}
