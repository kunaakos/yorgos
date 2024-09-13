import { ActorFn, ActorStateHandler } from './types/actor'
import { Mailbox } from './types/mailbox'
import { DispatchFn } from './types/system'

// TODO: state and message types, refactor to make it less imperative
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
}) => {
    let processing: boolean = false

    const handleProcessingError = (error: any) => {
        processing = false
        console.error(error)
    }

    // NOTE: quick and dirty solution for browser and node support
    const fallback = (cb: () => void) => cb()
    const eventually = setImmediate || requestIdleCallback || fallback

    const processMessages = () => {
        eventually(() => {
            if (!processing) {
                processing = true
                processLoop().catch(handleProcessingError)
            }
        })
    }

    const processLoop = async () => {
        while (processing) {
            const msg = mailbox.getOldest()
            if (!msg) {
                processing = false
            } else {
                try {
                    const newState = await fn({
                        state: state.get(),
                        msg,
                        dispatch,
                    })
                    newState && state.set(newState)
                } catch {
                    // messages that cause errors are dropped
                    // TODO: supervision policies and error logging
                }
                mailbox.deleteOldest()
            }
        }
    }

    return {
        processMessages,
    }
}
