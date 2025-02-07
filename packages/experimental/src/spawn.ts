import { SpawnFn } from 'src/types/actor'
import { Message } from 'src/types/message'

import { initMailbox } from 'src/mailbox'
import { initStateHandler } from 'src/stateHandler'
import { initSupervisor } from 'src/supervisor'

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

    const deliver = (message: Message) => {
        mailbox.deliver(message)
        supervisor.processMessages()
    }

    return { id, deliver }
}
