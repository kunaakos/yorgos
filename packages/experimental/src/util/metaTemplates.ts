import { ActorId, MessageId } from 'src/types/base'
import {
    PlainMessageMeta,
    QueryMessageMeta,
    ResponseMessageMeta,
} from 'src/types/messageMeta'

import { uniqueId } from 'src/util/uniqueId'

export const plainMeta = ({ to }: { to: ActorId }): PlainMessageMeta => ({
    id: uniqueId(),
    cat: 'P',
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

export const responseMetaTo = ({
    rsvp,
    id,
}: QueryMessageMeta): ResponseMessageMeta => ({
    id: uniqueId(),
    cat: 'R',
    to: rsvp,
    irt: id,
})
