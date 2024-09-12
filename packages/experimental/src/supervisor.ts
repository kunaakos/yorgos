import { Mailbox } from './mailbox'
import { StateHandler } from './stateHandler'
import { ActorFn } from './actor'
import { DispatchFn } from './messageHub'

export type InitSupervisorArgs = {
    fn: ActorFn<any, any>
    dispatch: DispatchFn
    state: StateHandler<any>
    mailbox: Mailbox
}

export const initSupervisor = ({
    fn,
    dispatch,
    state,
    mailbox,
}: InitSupervisorArgs) => {
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
