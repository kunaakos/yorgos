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
    content: ContentType
}
export const message = <ContentType extends Serializable = Serializable>({
    to,
    type,
    content,
}: MessageTemplateArgs<ContentType>): NoResponseExpectedMessage<ContentType> => ({
    id: generateRandomId(),
    cat: 'NRE',
    to,
    type,
    content,
})

type ResponseToTemplateArgs<ContentType> = {
    msg: QueryMessage<any>
    type: MessageType
    content: ContentType
}
export const responseTo = <ContentType extends Serializable = Serializable>({
    msg,
    type,
    content,
}: ResponseToTemplateArgs<ContentType>): ResponseMessage<ContentType> => ({
    id: generateRandomId(),
    cat: 'R',
    to: msg.rsvp,
    irt: msg.id,
    type,
    content,
})
