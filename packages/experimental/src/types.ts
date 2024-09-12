export type Nullable<T> = T | null

type Id = string

export type ActorId = Id
export type MessageId = Id

export type Primitive = string | number | boolean | null

export type Serializable = {
    [key: string]: Primitive | Primitive[] | Serializable | Serializable[]
}

export type MessageType = Uppercase<string>

export type MessageBase = {
    cat: string
    type: MessageType
}

export type SimpleMessageMeta = {
    id: MessageId
    to: ActorId
}

export type SimpleMessage<PayloadType extends Serializable = Serializable> =
    MessageBase & {
        cat: 'NRE'
        payload?: PayloadType
        meta: SimpleMessageMeta
    }

export type QueryMessageMeta = {
    id: MessageId
    to: ActorId
    rsvp: ActorId
}

export type QueryMessage<PayloadType extends Serializable = Serializable> =
    MessageBase & {
        cat: 'Q'
        payload?: PayloadType
        meta: QueryMessageMeta
    }

export type ResponseMessageMeta = {
    id: MessageId
    to: ActorId
    irt: MessageId
}

export type ResponseMessage<PayloadType extends Serializable = Serializable> =
    MessageBase & {
        cat: 'R'
        payload?: PayloadType
        meta: ResponseMessageMeta
    }

// tagged union type with `type` and `cat` as discriminants
export type Message<PayloadType extends Serializable = Serializable> =
    | SimpleMessage<PayloadType>
    | QueryMessage<PayloadType>
    | ResponseMessage<PayloadType>

export type MessageList = Message[]
