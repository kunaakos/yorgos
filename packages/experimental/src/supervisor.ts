import { MakeSupervisorArgs, Supervisor } from 'src/types/supervisor'

import { condition } from 'src/util/condition'
import { eventually } from 'src/util/eventually'

export const makeSupervisor = ({
    fn,
    dispatch,
    state,
    context,
    mailbox,
}: MakeSupervisorArgs): Supervisor => {
    const processing = condition(false)
    const processLoop = async () => {
        if (processing.is(true) && mailbox.hasMessages()) {
            try {
                const msg = mailbox.getOldest()
                const newState = await fn({
                    state: state ? await state.get() : null,
                    context,
                    msg,
                    dispatch,
                })
                newState && state && (await state.set(newState))
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
