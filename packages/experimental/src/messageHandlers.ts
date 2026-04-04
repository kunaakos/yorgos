import { ActorFn } from 'src/types/actor'
import { Nullable, Serializable } from 'src/types/base'
import { Message } from 'src/types/message'
import { MessageHandlers } from 'src/types/messageHandlers'
import { AnyRecord } from 'src/types/util'

export const usingMessageHandlers =
    <
        AcceptedMessages extends Message,
        State extends Nullable<Serializable>,
        Context extends AnyRecord,
    >(
        handlers: MessageHandlers<AcceptedMessages, State, Context>,
    ): ActorFn<AcceptedMessages, State, Context> =>
    (params) => {
        if (handlers.hasOwnProperty(params.msg.type)) {
            // @ts-expect-error
            return handlers[params.msg.type](params)
        } else if (handlers.other) {
            return handlers.other(params)
        } else {
            throw new Error('Received message of unexpected type.')
        }
    }
