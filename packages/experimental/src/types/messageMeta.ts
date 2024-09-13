import { ActorId, MessageId } from './base'

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
