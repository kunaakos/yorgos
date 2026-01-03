import { ActorFn } from 'src/types/actor'
import { Message } from 'src/types/message'
import {
    InferAcceptedMessageType,
    InferContextType,
    InferStateType,
} from 'src/types/util'

export type MessageHandlers<Fn extends ActorFn<any, any, any>> = {
    [MessageType in InferAcceptedMessageType<Fn>['type']]: ActorFn<
        Extract<InferAcceptedMessageType<Fn>, { type: MessageType }>,
        InferStateType<Fn>,
        InferContextType<Fn>
    >
} & {
    other?: ActorFn<Message, InferStateType<Fn>, InferContextType<Fn>>
}
