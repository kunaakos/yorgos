import { ActorFn } from 'src/types/actor'
import { Message } from 'src/types/message'
import {
    InferAcceptedMessageTypes,
    InferContextType,
    InferStateType,
} from 'src/types/util'

export type MessageHandlers<Fn extends ActorFn<any, any, any>> = {
    [MessageType in InferAcceptedMessageTypes<Fn>['type']]: ActorFn<
        InferStateType<Fn>,
        InferContextType<Fn>,
        Extract<InferAcceptedMessageTypes<Fn>, { type: MessageType }>
    >
} & {
    other?: ActorFn<InferStateType<Fn>, InferContextType<Fn>, Message>
}
