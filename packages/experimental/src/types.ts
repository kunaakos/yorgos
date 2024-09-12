export type Nullable<T> = T | null

type Id = string

export type ActorId = Id
export type MessageId = Id

export type Primitive = string | number | boolean | null

export type Serializable = {
    [key: string]: Primitive | Primitive[] | Serializable | Serializable[]
}

export type MessageType = Uppercase<string>

export type WithMessageType<
    CustomMessageType extends MessageType = MessageType,
> = {
    type: CustomMessageType
}

export type WithPayload<PayloadType extends Serializable = Serializable> = {
    payload: PayloadType
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

export type Message = WithMessageType & WithMeta & Partial<WithPayload>

export type MessageList = Message[]
