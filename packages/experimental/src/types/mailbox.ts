import { Nullable } from './base'
import { Message } from './message'
import { MessageList } from './system'

export type Mailbox = {
    hasMessages: () => boolean
    deliver: (messages: MessageList) => void
    getOldest: () => Nullable<Message>
    deleteOldest: () => void
    getAll: () => MessageList
    deleteAll: () => void
}
