import { SpawnStatefulActorFn, SpawnStatelessActorFn } from 'src/types/actor'
import { Message } from 'src/types/message'

import { initMailbox } from 'src/mailbox'
import {
    initInMemoryStateHandler,
    initPersistentStateHandler,
    nullStateHandler,
} from 'src/stateHandler'
import { initSupervisor } from 'src/supervisor'

export const spawnStatefulActor: SpawnStatefulActorFn = async ({
    id,
    fn,
    dispatch,
    persistentState,
    initialState,
    context,
}) => {
    const mailbox = initMailbox()
    const state = persistentState
        ? await initPersistentStateHandler({
              initialState,
              persistentState,
          })
        : initInMemoryStateHandler({
              initialState,
          })
    const supervisor = initSupervisor({
        fn,
        dispatch,
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

export const spawnStatelessActor: SpawnStatelessActorFn = ({
    id,
    fn,
    dispatch,
    context,
}) => {
    const mailbox = initMailbox()
    const supervisor = initSupervisor({
        fn,
        dispatch,
        state: nullStateHandler,
        context,
        mailbox,
    })

    const actorDispatch = (message: Message) => {
        mailbox.deliver(message)
        supervisor.processMessages()
    }

    return { id, dispatch: actorDispatch }
}
