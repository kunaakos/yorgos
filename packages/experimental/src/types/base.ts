export type Nullable<T> = T | null

type Id = string

export type ActorSystemId = Id
export type ActorId = Id
export type MessageId = Id

/**
 * This type is basically a subset of JSON, with less cases
 * to handle when processing.
 * It's used for messages, because messages need to be serialized in some cases,
 * but it also stops actors from spilling their guts by passing around
 * references to their internals.
 */
export type Primitive = string | number | boolean | null
export type SerializableArray = (Primitive | Serializable | SerializableArray)[]
export type Serializable = {
    [key: string]: Primitive | Serializable | SerializableArray
}
