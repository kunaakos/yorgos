import { Message } from 'src/types/message'
import { MakeSpawnStatefulFn, MakeSpawnStatelessFn } from 'src/types/spawn'

export const makeSpawnStateful: MakeSpawnStatefulFn =
    ({ messaging, makeStateHandler, makeMailbox, makeSupervisor }) =>
    ({ id, fn, initialState, validator, context }) => {
        const mailbox = makeMailbox()

        const state = makeStateHandler({
            id,
            initialState,
            validator: validator || null,
        })

        const supervisor = makeSupervisor({
            fn,
            dispatch: messaging.dispatch,
            state,
            context: context || {},
            mailbox,
        })

        const actorDispatch = (message: Message) => {
            mailbox.deliver(message)
            supervisor.processMessages()
        }

        const actor = { id, dispatch: actorDispatch }
        messaging.connectActor(actor)
        return actor
    }

export const makeSpawnStateless: MakeSpawnStatelessFn =
    ({ messaging, makeMailbox, makeSupervisor }) =>
    ({ id, fn, context }) => {
        const mailbox = makeMailbox()

        const supervisor = makeSupervisor({
            fn,
            dispatch: messaging.dispatch,
            state: null,
            context: context || {},
            mailbox,
        })

        const actorDispatch = (message: Message) => {
            mailbox.deliver(message)
            supervisor.processMessages()
        }

        const actor = { id, dispatch: actorDispatch }
        messaging.connectActor(actor)
        return actor
    }
