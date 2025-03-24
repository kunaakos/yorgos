import { ActorFn } from 'src/types/actor'
import { Message } from 'src/types/message'

export type TypeAndPayloadOf<
    MessageType extends Message = Message, //
> = Pick<MessageType, 'type' | 'payload'>

export type AsyncOrSync<ReturnType> = ReturnType | Promise<ReturnType>

export type AnyRecord = Record<string | symbol, any>

export type InferStateType<Fn> =
    Fn extends ActorFn<infer S, any, any> ? S : never
export type InferContextType<Fn> =
    Fn extends ActorFn<any, infer C, any> ? C : never
export type InferAcceptedMessageTypes<Fn> =
    Fn extends ActorFn<any, any, infer A> ? A : never
