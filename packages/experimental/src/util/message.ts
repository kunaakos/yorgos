import { ActorId } from '../types/base'
import { Message } from '../types/message'
import { cloneMessage } from './cloneMessage'
import { uniqueId } from './uniqueId'

export const forwardedCopyOf = <MessageType extends Message>({
    message,
    to,
}: {
    message: MessageType
    to: ActorId
}): MessageType => {
    const clone = cloneMessage(message)
    return {
        ...clone,
        meta: {
            ...clone.meta,
            id: uniqueId(),
            to,
        },
    }
}
