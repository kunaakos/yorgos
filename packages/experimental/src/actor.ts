import { initStateHandler } from './stateHandler'
import { initSupervisor } from './supervisor'
import { initMailbox } from './mailbox'
import { ActorId, MessageList } from './types'
import { ActorFn } from './types/actorFn'
import { Actor, DispatchFn } from './types/system'

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
