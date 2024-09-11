import { initStateHandler } from './stateHandler'
import { initSupervisor } from './supervisor'
import { initMailbox } from './mailbox'
import { Id, Message, MessageList, Nullable } from './types'
import { DispatchFn } from './messageHub'

export type ActorFnArgs<StateType> = {
    state: StateType
    msg: Message
    dispatch: DispatchFn
}

export type ActorFn<StateType> = (
    args: ActorFnArgs<StateType>,
) => Nullable<StateType> | Promise<Nullable<StateType>>

export type Actor = {
    id: Id
    deliver: DispatchFn
}

export type SpawnActorArgs<StateType> = {
    id: Id
    fn: ActorFn<StateType>
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
