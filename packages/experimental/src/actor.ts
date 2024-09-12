import { initStateHandler } from './stateHandler'
import { initSupervisor } from './supervisor'
import { initMailbox } from './mailbox'
import { ActorId, Message, MessageList, Nullable } from './types'
import { DispatchFn } from './messageHub'

export type ActorFnArgs<StateType, MessageType extends Message> = {
    state: StateType
    msg: MessageType
    dispatch: DispatchFn
}

export type ActorFn<StateType, MessageType extends Message = Message> = (
    args: ActorFnArgs<StateType, MessageType>,
) => Nullable<StateType> | Promise<Nullable<StateType>>

export type Actor = {
    id: ActorId
    deliver: DispatchFn
}

export type SpawnActorArgs<StateType> = {
    id: ActorId
    fn: ActorFn<StateType, any>
    dispatch: DispatchFn
    initialState: StateType
}

export const spawnActor = <StateType>({
    id,
    fn,
    dispatch,
    initialState,
}: SpawnActorArgs<StateType>): Actor => {
    const mailbox = initMailbox()
    const state = initStateHandler<StateType>({ initialState })
    const supervisor = initSupervisor({
        fn,
        dispatch,
        state,
        mailbox,
    })

    const deliver = (messages: MessageList) => {
        mailbox.deliver(messages)
        supervisor.processMessages()
    }

    const self: Actor = { id, deliver }
    return self
}
