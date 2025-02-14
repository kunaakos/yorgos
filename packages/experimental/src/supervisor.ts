import { ActorFn, ActorStateHandler } from 'src/types/actor'
import { Mailbox } from 'src/types/mailbox'
import { Supervisor } from 'src/types/supervisor'
import { DispatchFn } from 'src/types/system'

import { condition } from 'src/util/condition'
import { eventually } from 'src/util/eventually'

export const initSupervisor = ({
    fn,
    dispatch,
    state,
    mailbox,
}: {
    fn: ActorFn<any, any>
    dispatch: DispatchFn
    state: ActorStateHandler<any>
    mailbox: Mailbox
}): Supervisor => {
    const processing = condition(false)
    const processLoop = async () => {
        if (processing.is(true) && mailbox.hasMessages()) {
            try {
                const msg = mailbox.getOldest()
                const newState = await fn({
                    state: state.get(),
                    msg,
                    dispatch,
                })
                newState && state.set(newState)
            } catch (error) {
                /**
                 * Messages that cause errors are dropped, there are no other
                 * supervision policies implemented currently.
                 */
                console.error(error)
            } finally {
                mailbox.deleteOldest()
                eventually(processLoop)()
            }
        } else {
            processing.set(false)
        }
    }

    /**
     * NOTE:
     * Processing messages should not block the flow of the function that
     * called the `DispatchFn` triggering message processing,
     * an actor with a stuffed mailbox should allow others to process
     * their own mail.
     * To allow for this to happen, `processLoop` is a bit of a tangle
     * but will do for now, messaging and supervision should change anyways,
     * so there's no point in fixating on this too soon.
     */
    const processMessages = //
        processing.toggleAndDoIf(false, eventually(processLoop))

    return {
        processMessages,
    }
}
