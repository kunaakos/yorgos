export type Nullable<T> = T | null

type Id = string

export type ActorId = Id
export type MessageId = Id

export type Primitive = string | number | boolean | null

export type Serializable = {
    [key: string]: Primitive | Primitive[] | Serializable | Serializable[]
}

export type MessageType = Uppercase<string>

export type WithType<CustomMessageType extends MessageType = MessageType> = {
    type: CustomMessageType
}

export type SimpleMessageMeta = {
    id: MessageId
    cat: 'NRE'
    to: ActorId
}

export type QueryMessageMeta = {
    id: MessageId
    cat: 'Q'
    to: ActorId
    rsvp: ActorId
}

export type ResponseMessageMeta = {
    id: MessageId
    cat: 'R'
    to: ActorId
    irt: MessageId
}

export type MessageMeta =
    | SimpleMessageMeta
    | QueryMessageMeta
    | ResponseMessageMeta

export type WithMeta<MetaType extends MessageMeta = MessageMeta> = {
    meta: MetaType
}

export type WithPayload<PayloadType extends Serializable = Serializable> = {
    payload: PayloadType
}

export type Message = WithType & WithMeta & Partial<WithPayload>

// tagged union type with `type` and `cat` as discriminants
// export type Message<PayloadType extends Serializable = Serializable> =
//     | SimpleMessage<PayloadType>
//     | QueryMessage<PayloadType>
//     | ResponseMessage<PayloadType>

export type MessageList = Message[]
