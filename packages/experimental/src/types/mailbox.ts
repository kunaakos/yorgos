import { Message } from 'src/types/message'

export type Mailbox = {
    hasMessages: () => boolean
    isEmpty: () => boolean
    deliver: (message: Message) => void
    getOldest: () => Message
    deleteOldest: () => void
    getAll: () => Message[]
    deleteAll: () => void
}
