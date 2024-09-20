import { ActorId } from 'src/types/base'
import { Message } from 'src/types/message'

import { cloneMessage } from 'src/util/cloneMessage'
import { uniqueId } from 'src/util/uniqueId'

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
