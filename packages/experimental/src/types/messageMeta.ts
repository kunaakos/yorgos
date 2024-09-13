import { ActorId, MessageId } from './base'

type MessageMetaCommon = {
    id: MessageId
    to: ActorId
    via?: ActorId[]
}

export type SimpleMessageMeta = MessageMetaCommon & {
    cat: 'NRE'
    via?: ActorId[]
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
    | SimpleMessageMeta
    | QueryMessageMeta
    | ResponseMessageMeta
