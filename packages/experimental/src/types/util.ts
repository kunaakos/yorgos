import { ActorFn } from 'src/types/actor'
import { Message } from 'src/types/message'

export type TypeAndPayloadOf<MessageType extends Message> = Pick<
    MessageType,
    'type' | 'payload'
>

export type AsyncOrSync<ReturnType> = ReturnType | Promise<ReturnType>

export type AnyRecord = Record<string | symbol, any>
export type AnyStringRecord = Record<string, any>
export type EmptyRecord = Record<string, never>

export type InferStateType<Fn> =
    Fn extends ActorFn<any, infer S, any> ? S : never
export type InferContextType<Fn> =
    Fn extends ActorFn<any, any, infer C> ? C : never
export type InferAcceptedMessagesType<Fn> =
    Fn extends ActorFn<infer AM, any, any> ? AM : never
