import { ActorFn, ActorStateHandler } from './types/actor'
import { Mailbox } from './types/mailbox'
import { Supervisor } from './types/supervisor'
import { DispatchFn } from './types/system'
import { condition } from './util/condition'
import { eventually } from './util/eventually'

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
