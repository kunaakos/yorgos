import {
    ActorId,
    MessageType,
    NoResponseExpectedMessage,
    QueryMessage,
    ResponseMessage,
    Serializable,
} from './types'
import { generateRandomId } from './util'

type MessageTemplateArgs<ContentType> = {
    to: ActorId
    type: MessageType
    payload?: ContentType
}
export const message = <ContentType extends Serializable = Serializable>({
    to,
    type,
    payload,
}: MessageTemplateArgs<ContentType>): NoResponseExpectedMessage<ContentType> => ({
    type,
    cat: 'NRE',
    ...(payload ? { payload } : {}),
    meta: {
        id: generateRandomId(),
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
        id: generateRandomId(),
        to: msg.meta.rsvp,
        irt: msg.meta.id,
    },
})
