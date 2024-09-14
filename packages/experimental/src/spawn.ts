import { initStateHandler } from './stateHandler'
import { initSupervisor } from './supervisor'
import { initMailbox } from './mailbox'
import { SpawnFn } from './types/actor'
import { MessageList } from './types/system'

/**
 * The most important thing about `Actor`s is that they're just closures.
 * There is no actor object, just reference(s) to the actor's function(s).
 * Actor functionality is composed of these functions.
 * Try not to cling to things (keep references), which will
 * stop actors from being garbage collected when their time is due.
 */
export const spawn: SpawnFn = ({ id, fn, dispatch, initialState }) => {
    const mailbox = initMailbox()
    const state = initStateHandler({ initialState })
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

    return { id, deliver }
}
