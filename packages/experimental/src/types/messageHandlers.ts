import { ActorFn } from 'src/types/actor'
import { Message, MessageValidatorFn } from 'src/types/message'
import {
    AnyRecord,
    EmptyRecord,
} from 'src/types/util'
import { Nullable, Serializable } from './base'

type MessageHandler<
    AcceptedMessageType extends Message,
    StateType extends Nullable<Serializable>,
    ContextType extends AnyRecord
> = ActorFn<AcceptedMessageType, StateType, ContextType> | {
    fn: ActorFn<AcceptedMessageType, StateType, ContextType>
    messageValidator: MessageValidatorFn<AcceptedMessageType>
}

export type MessageHandlers<
    AcceptedMessagesType extends Message = Message,
    StateType extends Nullable<Serializable> = null,
    ContextType extends AnyRecord = EmptyRecord,
> = {
    [MessageType in AcceptedMessagesType['type']]: MessageHandler<
        Extract<AcceptedMessagesType, { type: MessageType }>,
        StateType,
        ContextType
    >
} & {
    other?: ActorFn<Message, StateType, ContextType>
}
