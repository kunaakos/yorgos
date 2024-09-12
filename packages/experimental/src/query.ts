import { ActorFn, spawnActor } from './actor'
import { ActorId, Message, MessageId } from './types'
import { uniqueId } from './util/uniqueId'
import { DispatchFn, MessageHub } from './messageHub'
import { queryMeta } from './util/metaTemplates'

type QueryOptions = {
    timeout: number
}

type QueryFnArgs = {
    id: ActorId
    type: Message['type']
    payload: Message['payload']
    options?: QueryOptions
}
type QueryFnReturnType = Pick<Message, 'type' | 'payload'>

export type QueryFn = (args: QueryFnArgs) => Promise<QueryFnReturnType>

type InitQueryArgs = {
    dispatch: DispatchFn
    connectActor: MessageHub['connectActor']
    disconnectActor: MessageHub['disconnectActor']
}

const DEFAULT_QUERY_OPTIONS: QueryOptions = {
    timeout: 500,
}

export const initQuery =
    ({ dispatch, connectActor, disconnectActor }: InitQueryArgs): QueryFn =>
    /**
     * A single-use actor with a unique ID is spawned for every query.
     **/
    ({ id: to, type, payload, options = DEFAULT_QUERY_OPTIONS }) => {
        const queryId: MessageId = uniqueId()
        const queryActorId: ActorId = uniqueId()

        /**
         * This promise either resolves with a received message payload and type, or rejects with an error.
         **/
        const queryPromise: Promise<QueryFnReturnType> = new Promise(
            (resolve, reject) => {
                /**
                 * The actor function handles invalid responses, but does not time out by itself.
                 */
                const queryActorFn: ActorFn<null> = ({ msg: responseMsg }) => {
                    if (
                        responseMsg.meta.cat === 'R' &&
                        responseMsg.meta.irt === queryId
                    ) {
                        resolve({
                            type: responseMsg.type,
                            ...(responseMsg.payload
                                ? { payload: responseMsg.payload }
                                : {}),
                        })
                    } else {
                        reject(new Error('Invalid query response received.'))
                    }
                    disconnectActor({ id: queryActorId })
                    return null
                }

                const queryActor = spawnActor({
                    id: queryActorId,
                    dispatch: () => {},
                    fn: queryActorFn,
                    initialState: null,
                })
                connectActor(queryActor)

                dispatch([
                    {
                        type,
                        ...(payload ? { payload } : {}),
                        meta: queryMeta({
                            id: queryId,
                            to,
                            rsvp: queryActorId,
                        }),
                    },
                ])

                /**
                 * To handle timeouts, one must simply dispose of the query actor and reject the pending `queryPromise`.
                 * Any subsequent responses will be discarded (as of the current implementation),
                 * but this will not halt any ongoing process in the queried actor.
                 * TODO: add timeout value to `QueryMessageMeta`, so queried actors can limit themselves.
                 */
                setTimeout(() => {
                    disconnectActor({ id: queryActorId })
                    reject(new Error('Query timed out.'))
                }, options.timeout)
            },
        )

        return queryPromise
    }
