import { ActorId } from 'src/types/base'
import { Message } from 'src/types/message'

import { clone } from 'src/util/clone'
import { uniqueId } from 'src/util/uniqueId'

export const forwardedCopyOf = <MessageType extends Message>({
    message,
    to,
}: {
    message: MessageType
    to: ActorId
}): MessageType => {
    const messageClone = clone(message)
    return {
        ...messageClone,
        meta: {
            ...messageClone.meta,
            id: uniqueId(),
            to,
        },
    }
}
