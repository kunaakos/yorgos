import { Message } from 'src/types/message'

export type TypeAndPayloadOf<
    MessageType extends Message = Message, //
> = Pick<MessageType, 'type' | 'payload'>

export type AsyncOrSync<ReturnType> = ReturnType | Promise<ReturnType>
