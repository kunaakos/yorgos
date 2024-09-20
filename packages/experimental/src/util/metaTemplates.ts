import { ActorId, MessageId } from 'src/types/base'
import {
    QueryMessageMeta,
    ResponseMessageMeta,
    SimpleMessageMeta,
} from 'src/types/messageMeta'

import { uniqueId } from 'src/util/uniqueId'

export const simpleMessageMeta = ({
    to,
}: {
    to: ActorId
}): SimpleMessageMeta => ({
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
