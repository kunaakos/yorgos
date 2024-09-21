import { Nullable, Serializable } from 'src/types/base'
import {
    MessageMeta,
    PlainMessageMeta,
    QueryMessageMeta,
    ResponseMessageMeta,
} from 'src/types/messageMeta'

export type MessageTypeIdentifier = Uppercase<string>

export type Message<
    CustomMessageType extends MessageTypeIdentifier = MessageTypeIdentifier,
    PayloadType extends Nullable<Serializable> = Nullable<Serializable>,
    MetaType extends MessageMeta = MessageMeta,
> = {
    type: CustomMessageType
    payload: PayloadType
    meta: MetaType
}

export type PlainMessage<
    CustomMessageType extends MessageTypeIdentifier = MessageTypeIdentifier,
    PayloadType extends Nullable<Serializable> = Nullable<Serializable>,
> = {
    type: CustomMessageType
    payload: PayloadType
    meta: PlainMessageMeta
}

export type QueryMessage<
    CustomMessageType extends MessageTypeIdentifier = MessageTypeIdentifier,
    PayloadType extends Nullable<Serializable> = Nullable<Serializable>,
> = {
    type: CustomMessageType
    payload: PayloadType
    meta: QueryMessageMeta
}

export type ResponseMessage<
    CustomMessageType extends MessageTypeIdentifier = MessageTypeIdentifier,
    PayloadType extends Nullable<Serializable> = Nullable<Serializable>,
> = {
    type: CustomMessageType
    payload: PayloadType
    meta: ResponseMessageMeta
}
