export { initSystem } from './system'

export type { ActorFn } from './types/actor'
export type { QueryFnParams } from './types/queryFn'

export type { ActorId, MessageId, Serializable } from './types/base'

export type { ActorSystem, Actor, MessageList } from './types/system'

export type {
    Message,
    MessageType,
    WithMessageType,
    WithPayload,
    WithMeta,
} from './types/message'

export type {
    SimpleMessageMeta,
    QueryMessageMeta,
    ResponseMessageMeta,
} from './types/messageMeta'

export {
    simpleMessageMeta,
    queryMeta,
    responseMeta,
} from './util/metaTemplates'
export { uniqueId } from './util/uniqueId'
