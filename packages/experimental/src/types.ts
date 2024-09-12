export type Nullable<T> = T | null

export type Id = string

export type ActorId = Id
export type MessageId = Id

export type Primitive = string | number | boolean | null

export type Serializable = {
    [key: string]: Primitive | Primitive[] | Serializable | Serializable[]
}

export type MessageType = Uppercase<string>

export type NoResponseExpectedMessage<
    PayloadType extends Serializable = Serializable,
> = {
    type: MessageType
    cat: 'NRE'
    payload?: PayloadType
    meta: {
        id: MessageId
        to: ActorId
    }
}

export type QueryMessage<PayloadType extends Serializable = Serializable> = {
    type: MessageType
    cat: 'Q'
    payload?: PayloadType
    meta: {
        id: MessageId
        to: ActorId
        rsvp: ActorId
    }
}

export type ResponseMessage<PayloadType extends Serializable = Serializable> = {
    type: MessageType
    cat: 'R'
    error?: true
    payload?: PayloadType
    meta: {
        id: MessageId
        to: ActorId
        irt: MessageId
    }
}

// tagged union type with `type` and `cat` as discriminants
export type Message<PayloadType extends Serializable = Serializable> =
    | NoResponseExpectedMessage<PayloadType>
    | QueryMessage<PayloadType>
    | ResponseMessage<PayloadType>

export type MessageList = Message[]
