import { Message } from 'src/types/message'
import { MakeSpawnStatefulFn, MakeSpawnStatelessFn } from 'src/types/spawn'

import { stubStateValidator } from 'src/stateHandler'

export const makeSpawnStateful: MakeSpawnStatefulFn =
    ({ messaging, makeStateHandler, makeMailbox, makeSupervisor }) =>
    ({
        id,
        fn,
        initialState,
        isValidState = stubStateValidator,
        context = {},
    }) => {
        const mailbox = makeMailbox()

        const state = makeStateHandler({
            id,
            initialState,
            isValidState,
        })

        const supervisor = makeSupervisor({
            fn,
            dispatch: messaging.dispatch,
            state,
            context,
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
    ({ id, fn, context = {} }) => {
        const mailbox = makeMailbox()

        const supervisor = makeSupervisor({
            fn,
            dispatch: messaging.dispatch,
            state: null,
            context,
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
