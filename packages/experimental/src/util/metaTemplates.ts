import { ActorId } from 'src/types/base'
import {
    PlainMessageMeta,
    QueryMessageMeta,
    ResponseMessageMeta,
} from 'src/types/messageMeta'

import { uuidV7 } from 'src/util/uniqueId'

export const plainMeta = ({ to }: { to: ActorId }): PlainMessageMeta => ({
    mid: uuidV7(),
    cat: 'P',
    to,
})

export const responseMetaTo = ({
    rsvp,
    mid,
}: QueryMessageMeta): ResponseMessageMeta => ({
    mid: uuidV7(),
    cat: 'R',
    to: rsvp,
    irt: mid,
})
