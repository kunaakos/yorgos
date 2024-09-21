export type { ActorFn } from 'src/types/actor'
export type { QueryFnParams } from 'src/types/queryFn'

export type { ActorId, MessageId, Serializable } from 'src/types/base'

export type { ActorSystem, Actor, MessageList } from 'src/types/system'

export type {
    Message,
    PlainMessage,
    QueryMessage,
    ResponseMessage,
    MessageTypeIdentifier,
} from 'src/types/message'

export type {
    PlainMessageMeta,
    QueryMessageMeta,
    ResponseMessageMeta,
} from 'src/types/messageMeta'

export { initSystem } from 'src/system'

export {
    plainMeta as simpleMessageMeta,
    queryMeta,
    responseMetaTo as responseMeta,
} from 'src/util/metaTemplates'
export { uniqueId } from './util/uniqueId'
export { forwardedCopyOf } from './util/message'
