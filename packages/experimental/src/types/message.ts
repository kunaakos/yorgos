import { Serializable } from 'src/types/base'
import { MessageMeta } from 'src/types/messageMeta'

export type MessageType = Uppercase<string>

export type WithMessageType<
    CustomMessageType extends MessageType = MessageType, //
> = {
    type: CustomMessageType
}

export type WithPayload<
    PayloadType extends Serializable | null = Serializable | null, //
> = {
    payload: PayloadType
}

export type WithMeta<
    MetaType extends MessageMeta = MessageMeta, //
> = {
    meta: MetaType
}

export type Message = WithMessageType & WithMeta & WithPayload
