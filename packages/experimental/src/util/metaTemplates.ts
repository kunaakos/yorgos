import { ActorId, MessageId } from '../types/base'
import {
    QueryMessageMeta,
    ResponseMessageMeta,
    SimpleMessageMeta,
} from '../types/messageMeta'
import { uniqueId } from './uniqueId'

export const messageMeta = ({ to }: { to: ActorId }): SimpleMessageMeta => ({
    id: uniqueId(),
    cat: 'NRE',
    to,
})

export const queryMeta = ({
    id,
    to,
    rsvp,
}: {
    id: MessageId
    to: ActorId
    rsvp: ActorId
}): QueryMessageMeta => ({
    id,
    cat: 'Q',
    to,
    rsvp,
})

export const responseMeta = ({
    rsvp,
    id,
}: QueryMessageMeta): ResponseMessageMeta => ({
    id: uniqueId(),
    cat: 'R',
    to: rsvp,
    irt: id,
})
