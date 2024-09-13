import { spawnActor } from './actor'
import { ActorFn } from './types/actor'
import { ActorId, MessageId } from './types/base'
import { MessageHub } from './types/messageHub'
import { QueryFn } from './types/queryFn'
import { DispatchFn } from './types/system'
import { queryMeta } from './util/metaTemplates'
import { uniqueId } from './util/uniqueId'

const DEFAULT_QUERY_OPTIONS = {
    timeout: 500,
}

export const initQuery =
    ({
        dispatch,
        connectActor,
        disconnectActor,
    }: {
        dispatch: DispatchFn
        connectActor: MessageHub['connectActor']
        disconnectActor: MessageHub['disconnectActor']
    }): QueryFn =>
    ({ id: to, type, payload, options = DEFAULT_QUERY_OPTIONS }) => {
        /**
         * A single-use actor with a unique ID is spawned for dispatching every query message.
         * The creation and destruction of this actor is enclosed in this promise executor.
         * This promise either resolves with a received message's payload and type, or rejects with an (internal) error.
         **/
        return new Promise((resolve, reject) => {
            const queryId: MessageId = uniqueId()
            const queryActorId: ActorId = uniqueId()
            /**
             * The actor function handles unexpected responses, but does not time out by itself.
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
                    reject(new Error('Unexpected query response received.'))
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
        })
    }
