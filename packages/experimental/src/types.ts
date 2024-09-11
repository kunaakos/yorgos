export type Nullable<T> = T | null

export type Id = string

export type ActorId = Id
export type MessageId = Id

export type Primitive = string | number | boolean | null

export type Serializable = {
    [key: string]: Primitive | Primitive[] | Serializable | Serializable[]
}

export type MessageType = Uppercase<string>

type MessageBase<ContentType extends Serializable> = {
    id: MessageId
    type: string
    to: ActorId
    content: ContentType
}

export type NoResponseExpectedMessage<
    ContentType extends Serializable = Serializable,
> = MessageBase<ContentType> & {
    cat: 'NRE'
}

export type QueryMessage<ContentType extends Serializable = Serializable> =
    MessageBase<ContentType> & {
        cat: 'Q'
        rsvp: ActorId
    }

export type ResponseMessage<ContentType extends Serializable = Serializable> =
    MessageBase<ContentType> & {
        cat: 'R'
        irt: MessageId
    }

export type Message<ContentType extends Serializable = Serializable> =
    | NoResponseExpectedMessage<ContentType>
    | QueryMessage<ContentType>
    | ResponseMessage<ContentType>

export type MessageList = Message[]
