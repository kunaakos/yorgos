import { Actor, spawnActor, SpawnActorArgs } from './actor'
import { DispatchFn, initMessageHub } from './messageHub'
import { initQuery, QueryFn } from './query'

type SpawnSystemActorArgs<StateType> = Pick<
    SpawnActorArgs<StateType>,
    'id' | 'fn' | 'initialState'
>

type ActorSystem = {
    spawn: <StateType>(args: SpawnSystemActorArgs<StateType>) => Actor
    query: QueryFn
    dispatch: DispatchFn
}

export const initSystem = (): ActorSystem => {
    const messageHub = initMessageHub()

    const query = initQuery({
        dispatch: messageHub.dispatch,
        connectActor: messageHub.connectActor,
        disconnectActor: messageHub.disconnectActor,
    })

    const spawn = <StateType>({
        id,
        fn,
        initialState,
    }: SpawnSystemActorArgs<StateType>) => {
        const actor = spawnActor({
            id,
            fn,
            initialState,
            dispatch: messageHub.dispatch,
        })
        messageHub.connectActor(actor)
        return actor
    }

    return {
        spawn,
        query,
        dispatch: messageHub.dispatch,
    }
}
