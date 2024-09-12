import { spawnActor } from './actor'
import { ActorId, Message, MessageId } from './types'
import { generateRandomId } from './util'
import { DispatchFn, MessageHub } from './messageHub'

type QueryFnArgs = {
    id: ActorId
    type: Message['type']
    payload: Message['payload']
}

export type QueryFn = (args: QueryFnArgs) => Promise<Message['payload']>

type InitQueryArgs = {
    dispatch: DispatchFn
    connectActor: MessageHub['connectActor']
    disconnectActor: MessageHub['disconnectActor']
}

export const initQuery =
    ({ dispatch, connectActor, disconnectActor }: InitQueryArgs): QueryFn =>
    ({ id: to, type, payload }) => {
        // TODO: figure out proper error handling for this and make sure it's garbage collected
        const promise: Promise<Message['payload']> = new Promise(
            (resolve, reject) => {
                const queryId: MessageId = generateRandomId()
                const queryActor = spawnActor({
                    id: generateRandomId(),
                    dispatch: () => {},
                    fn: ({ msg }) => {
                        if (msg.cat === 'R' && msg.meta.irt === queryId) {
                            resolve(msg.payload)
                        } else {
                            reject()
                        }
                        disconnectActor({ id: queryActor.id })
                        return null
                    },
                    initialState: null,
                })
                connectActor(queryActor)
                dispatch([
                    {
                        type,
                        cat: 'Q',
                        ...(payload ? { payload } : {}),
                        meta: {
                            id: queryId,
                            to,
                            rsvp: queryActor.id,
                        },
                    },
                ])
            },
        )
        return promise
    }
