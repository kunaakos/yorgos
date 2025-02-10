import { ActorFn } from 'src/types/actor'
import { ActorId, MessageId } from 'src/types/base'
import { Messaging } from 'src/types/messaging'
import { QueryFn, QueryOptions } from 'src/types/queryFn'

import { queryMeta } from 'src/util/metaTemplates'
import { uniqueId } from 'src/util/uniqueId'

import { spawn } from 'src/spawn'

const DEFAULT_QUERY_OPTIONS: QueryOptions = {
    timeout: 500,
    isPublic: false,
}

export const initQuery =
    ({ messaging }: { messaging: Messaging }): QueryFn =>
    ({ id: to, type, payload, options: optionsProvided = {} }) => {
        const options: QueryOptions = {
            ...DEFAULT_QUERY_OPTIONS,
            ...optionsProvided,
        }

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
                messaging.disconnectActor({ id: queryActorId })
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
                    messaging.disconnectActor({ id: queryActorId })
                    resolve({
                        type: responseMsg.type,
                        payload: responseMsg.payload,
                    })
                } else {
                    clearTimeout(timeoutId)
                    messaging.disconnectActor({ id: queryActorId })
                    reject(new Error('Unexpected query response received.'))
                }
                return null
            }

            /**
             * You can query public actors residing in remote systems
             * by passing `isPublic: true` - in this case the query actor's
             * id will be published by messaging.
             */
            messaging.connectActor({
                actor: spawn({
                    id: queryActorId,
                    dispatch: () => {},
                    fn: queryActorFn,
                    initialState: null,
                }),
                isPublic: options.isPublic,
            })

            messaging.dispatch({
                type,
                payload,
                meta: queryMeta({
                    id: queryId,
                    to,
                    rsvp: queryActorId,
                }),
            })
        })
    }
