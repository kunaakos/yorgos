import { ActorFn } from 'src/types/actor'
import { Nullable, Serializable } from 'src/types/base'
import { Message } from 'src/types/message'
import { MessageHandlers } from 'src/types/messageHandlers'
import { AnyRecord } from 'src/types/util'

export const usingHandlers =
    <
        State extends Nullable<Serializable>,
        Context extends AnyRecord,
        AcceptedMessages extends Message = Message,
    >(
        handlers: MessageHandlers<ActorFn<State, Context, AcceptedMessages>>,
    ): ActorFn<State, Context, AcceptedMessages> =>
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
