import {
    ActorId,
    MessageType,
    SimpleMessage,
    QueryMessage,
    ResponseMessage,
    Serializable,
} from '../types'
import { uniqueId } from './uniqueId'

type MessageTemplateArgs<ContentType> = {
    to: ActorId
    type: MessageType
    payload?: ContentType
}
export const message = <ContentType extends Serializable = Serializable>({
    to,
    type,
    payload,
}: MessageTemplateArgs<ContentType>): SimpleMessage<ContentType> => ({
    type,
    cat: 'NRE',
    ...(payload ? { payload } : {}),
    meta: {
        id: uniqueId(),
        to,
    },
})

type ResponseToTemplateArgs<ContentType> = {
    msg: QueryMessage
    type: MessageType
    payload?: ContentType
    error?: true
}
export const responseTo = <ContentType extends Serializable = Serializable>({
    msg,
    type,
    payload,
    error,
}: ResponseToTemplateArgs<ContentType>): ResponseMessage<ContentType> => ({
    type,
    cat: 'R',
    ...(payload ? { payload } : {}),
    ...(error ? { error } : {}),
    meta: {
        id: uniqueId(),
        to: msg.meta.rsvp,
        irt: msg.meta.id,
    },
})
