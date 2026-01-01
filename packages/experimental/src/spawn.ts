import { Message } from 'src/types/message'
import { StatefulSpawnFn, StatelessSpawnFn } from 'src/types/spawn'

export const spawnStateful: StatefulSpawnFn = ({
    systemDispatch,
    makeStateHandler,
    makeMailbox,
    makeSupervisor,
    id,
    fn,
    initialState,
    isValidState,
    context,
}) => {
    const mailbox = makeMailbox()

    const state = makeStateHandler({
        id,
        initialState,
        isValidState,
    })

    const supervisor = makeSupervisor({
        fn,
        dispatch: systemDispatch,
        state,
        context,
        mailbox,
    })

    const actorDispatch = (message: Message) => {
        mailbox.deliver(message)
        supervisor.processMessages()
    }

    return { id, dispatch: actorDispatch }
}

export const spawnStateless: StatelessSpawnFn = ({
    systemDispatch,
    makeMailbox,
    makeSupervisor,
    id,
    fn,
    context,
}) => {
    const mailbox = makeMailbox()

    const supervisor = makeSupervisor({
        fn,
        dispatch: systemDispatch,
        state: null,
        context,
        mailbox,
    })

    const actorDispatch = (message: Message) => {
        mailbox.deliver(message)
        supervisor.processMessages()
    }

    return { id, dispatch: actorDispatch }
}
