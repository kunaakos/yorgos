import { ActorFn } from 'src/types/actor'
import { ActorId, MessageId } from 'src/types/base'
import { MessageHub } from 'src/types/messageHub'
import { QueryFn } from 'src/types/queryFn'
import { DispatchFn } from 'src/types/system'

import { queryMeta } from 'src/util/metaTemplates'
import { uniqueId } from 'src/util/uniqueId'

import { spawn } from 'src/spawn'

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
             * To handle timeouts, one must simply dispose of the query actor and reject the pending `queryPromise`.
             * Any subsequent responses will be discarded (as of the current implementation),
             * but this will not halt any ongoing process in the queried actor.
             */
            const timeoutId = setTimeout(() => {
                disconnectActor({ id: queryActorId })
                reject(new Error('Query timed out.'))
            }, options.timeout)

            /**
             * The actor function handles unexpected responses, but does not time out by itself.
             */
            const queryActorFn: ActorFn<null> = ({ msg: responseMsg }) => {
                if (
                    responseMsg.meta.cat === 'R' &&
                    responseMsg.meta.irt === queryId
                ) {
                    clearTimeout(timeoutId)
                    disconnectActor({ id: queryActorId })
                    resolve({
                        type: responseMsg.type,
                        payload: responseMsg.payload,
                    })
                } else {
                    clearTimeout(timeoutId)
                    disconnectActor({ id: queryActorId })
                    reject(new Error('Unexpected query response received.'))
                }
                return null
            }

            connectActor(
                spawn({
                    id: queryActorId,
                    dispatch: () => {},
                    fn: queryActorFn,
                    initialState: null,
                }),
            )

            dispatch([
                {
                    type,
                    payload,
                    meta: queryMeta({
                        id: queryId,
                        to,
                        rsvp: queryActorId,
                    }),
                },
            ])
        })
    }
