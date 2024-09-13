import { Serializable } from './base'
import { MessageMeta } from './messageMeta'

export type MessageType = Uppercase<string>

export type WithMessageType<
    CustomMessageType extends MessageType = MessageType, //
> = {
    type: CustomMessageType
}

export type WithPayload<
    PayloadType extends Serializable = Serializable, //
> = {
    payload: PayloadType
}

export type WithMeta<
    MetaType extends MessageMeta = MessageMeta, //
> = {
    meta: MetaType
}

export type Message = WithMessageType & WithMeta & Partial<WithPayload>
