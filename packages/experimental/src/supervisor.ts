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

    /**
     * Processing messages should not block the flow of the function that
     * called the `DispatchFn` triggering message processing.
     */
    const processMessages = eventually(
        processing.toggleAndDoIf(false, () => {
            processLoop()
                .then(() => {
                    processing.set(false)
                })
                .catch((error: any) => {
                    processing.set(false)
                    console.error(error)
                })
        }),
    )

    const processLoop = async () => {
        while (processing.is(true) && mailbox.hasMessages()) {
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
            }
        }
    }

    return {
        processMessages,
    }
}
