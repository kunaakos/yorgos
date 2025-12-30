import { ActorFn } from 'src/types/actor'
import { Nullable } from 'src/types/base'
import { Mailbox } from 'src/types/mailbox'
import { StateHandler } from 'src/types/stateHandler.type'
import { Supervisor } from 'src/types/supervisor'
import { DispatchFn } from 'src/types/system'
import { AnyRecord } from 'src/types/util'

import { condition } from 'src/util/condition'
import { eventually } from 'src/util/eventually'

export const initSupervisor = ({
    fn,
    dispatch,
    state,
    context,
    mailbox,
}: {
    fn: ActorFn<any, any>
    dispatch: DispatchFn
    state: StateHandler<any>
    context: Nullable<AnyRecord>
    mailbox: Mailbox
}): Supervisor => {
    const processing = condition(false)
    const processLoop = async () => {
        if (processing.is(true) && mailbox.hasMessages()) {
            try {
                const msg = mailbox.getOldest()
                const newState = await fn({
                    state: state.get(),
                    context,
                    msg,
                    dispatch,
                })
                newState && (await state.set(newState))
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
