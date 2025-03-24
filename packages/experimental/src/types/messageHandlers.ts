import { ActorFn } from './actor'
import { Message } from './message'
import {
    InferAcceptedMessageTypes,
    InferContextType,
    InferStateType,
} from './util'

export type MessageHandlers<Fn extends ActorFn<any, any, any>> = {
    [MessageType in InferAcceptedMessageTypes<Fn>['type']]: ActorFn<
        InferStateType<Fn>,
        InferContextType<Fn>,
        Extract<InferAcceptedMessageTypes<Fn>, { type: MessageType }>
    >
} & {
    other?: ActorFn<InferStateType<Fn>, InferContextType<Fn>, Message>
}
