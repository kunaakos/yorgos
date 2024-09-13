import { SpawnActorArgs } from '../actor'
import { ActorId, Nullable } from './base'
import { Message } from './message'
import { QueryFn } from './queryFn'

export type MessageList = Message[]

export type DispatchFn = (messages: MessageList) => void

export type Actor = {
    id: ActorId
    deliver: DispatchFn
}

export type StateHandler<StateType> = {
    get: () => StateType
    set: (newState: StateType) => void
}

export type ActorSystem = {
    spawn: <StateType>(args: SpawnSystemActorArgs<StateType>) => Actor
    query: QueryFn
    dispatch: DispatchFn
}

export type Mailbox = {
    hasMessages: () => boolean
    deliver: (messages: MessageList) => void
    getOldest: () => Nullable<Message>
    deleteOldest: () => void
    getAll: () => MessageList
    deleteAll: () => void
}

export type SpawnSystemActorArgs<StateType> = //..
    Pick<
        SpawnActorArgs<StateType>, //..
        'id' | 'fn' | 'initialState' //..
    >
