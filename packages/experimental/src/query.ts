import { ActorId, MessageId } from 'src/types/base'
import { Message } from 'src/types/message'
import { MakeQuery, QueryOptions } from 'src/types/queryFn'

import { uuidV7 } from './util/uniqueId'

const DEFAULT_QUERY_OPTIONS: QueryOptions = {
    timeout: 500,
}

export const makeQuery: MakeQuery =
    ({
        //
        messaging,
        uniqueId,
    }) =>
    ({
        //
        id: to,
        type,
        payload,
        options: optionsProvided = {},
    }) => {
        const options: QueryOptions = {
            ...DEFAULT_QUERY_OPTIONS,
            ...optionsProvided,
        }

        /**
         * A single-use mock actor with a unique ID is spawned to accept responses to queries.
         * The creation and destruction of this actor is enclosed in this promise executor.
         **/
        return new Promise((resolve, reject) => {
            const queryMessageId: MessageId = uuidV7()
            const queryActorId: ActorId = uniqueId()

            /**
             * To handle timeouts, one must dispose of the query actor and reject the pending `queryPromise`.
             * It's up to `Messaging` to handle any responses coming in after the cutoff.
             */
            const timeoutId = setTimeout(() => {
                messaging.disconnectActor({ id: queryActorId })
                reject(new Error('Query timed out.'))
            }, options.timeout)

            /**
             * Instead of a full-blown actor with a supervisor, a mock actor is created.
             * This is immediately executed and throws on unexpected responses.
             */
            messaging.connectActor({
                id: queryActorId,
                dispatch: (responseMsg: Message) => {
                    clearTimeout(timeoutId)
                    messaging.disconnectActor({ id: queryActorId })
                    if (
                        responseMsg.meta &&
                        responseMsg.meta.cat === 'R' &&
                        responseMsg.meta.irt === queryMessageId
                    ) {
                        resolve({
                            type: responseMsg.type,
                            payload: responseMsg.payload,
                        })
                    } else {
                        reject(new Error('Malformed query response received.'))
                    }
                },
            })

            messaging.dispatch({
                type,
                payload,
                meta: {
                    mid: queryMessageId,
                    to,
                    cat: 'Q',
                    rsvp: queryActorId,
                },
            })
        })
    }
