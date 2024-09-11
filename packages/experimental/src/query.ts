import { spawnActor } from './actor'
import { Id, Message, MessageId } from './types'
import { generateRandomId } from './util'
import { DispatchFn, MessageHub } from './messageHub'

type QueryFnArgs = {
    id: Id
    type: Message['type']
    content: Message['content']
}

export type QueryFn = (args: QueryFnArgs) => Promise<Message['content']>

type InitQueryArgs = {
    dispatch: DispatchFn
    connectActor: MessageHub['connectActor']
    disconnectActor: MessageHub['disconnectActor']
}

export const initQuery =
    ({ dispatch, connectActor, disconnectActor }: InitQueryArgs): QueryFn =>
    ({ id: to, type, content }) => {
        // TODO: figure out proper error handling for this and make sure it's garbage collected
        const promise: Promise<Message['content']> = new Promise(
            (resolve, reject) => {
                const queryId: MessageId = generateRandomId()
                const queryActor = spawnActor({
                    id: generateRandomId(),
                    dispatch: () => {},
                    fn: ({ msg }) => {
                        if (msg.cat === 'R' && msg.irt === queryId) {
                            resolve(msg.content)
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
                        id: queryId,
                        cat: 'Q',
                        to,
                        rsvp: queryActor.id,
                        type,
                        content,
                    },
                ])
            },
        )
        return promise
    }
