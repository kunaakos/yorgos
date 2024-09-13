import { Message } from './message'

export type TypeAndpayloadOf<
    MessageType extends Message = Message, //
> = Pick<MessageType, 'type' | 'payload'>

export type AsyncOrSync<ReturnType> = ReturnType | Promise<ReturnType>
