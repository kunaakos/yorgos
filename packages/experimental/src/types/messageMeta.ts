import { ActorId, MessageId } from 'src/types/base'

type MessageMetaCommon = {
    id: MessageId
    to: ActorId
    via?: ActorId[]
}

export type PlainMessageMeta = MessageMetaCommon & {
    cat: 'P'
}

export type QueryMessageMeta = MessageMetaCommon & {
    cat: 'Q'
    rsvp: ActorId
}

export type ResponseMessageMeta = MessageMetaCommon & {
    cat: 'R'
    irt: MessageId
}

export type MessageMeta =
    | PlainMessageMeta
    | QueryMessageMeta
    | ResponseMessageMeta
