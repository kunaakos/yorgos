import { ActorFn } from 'src/types/actor'
import { PlainMessage, QueryMessage, ResponseMessage } from 'src/types/message'

import { plainMeta, responseMetaTo } from 'src/util/metaTemplates'
import { uniqueId } from 'src/util/uniqueId'

import { initSystem } from 'src/system'

jest.mock('src/util/uniqueId')

const delay = (millis: number) =>
    new Promise((resolve) => setTimeout(resolve, millis))

type TestMessage = PlainMessage<
    'TEST_MESSAGE', //
    null //
>

type TestMessageWithPayload = PlainMessage<
    'TEST_MESSAGE_WITH_PAYLOAD', //
    { string: string } //
>

type TestQueryMessage = QueryMessage<
    'TEST_QUERY', //
    { string: string } //
>

type TestResponseMessage = ResponseMessage<
    'TEST_RESPONSE', //
    { string: string } //
>

describe('actor system', () => {
    beforeEach(() => {
        let mockIdNr = 1
        ;(uniqueId as jest.Mock).mockImplementation(
            () => `MOCK_ID_${mockIdNr++}`,
        )
    })

    test('messaging', async () => {
        const messageLog: string[] = []

        const TEST_ACTOR_ID = 'TEST_ACTOR'

        const actorFn: ActorFn<null, TestMessageWithPayload> = ({ msg }) => {
            messageLog.push(JSON.stringify(msg))
            msg.payload['string'] = 'mutated'
            return null
        }

        const system = initSystem()
        const actor = system.spawn({
            id: TEST_ACTOR_ID,
            fn: actorFn,
            initialState: null,
        })

        const dispatchedpayload = { string: 'not mutated' }
        const testMutationMessage: TestMessageWithPayload = {
            type: 'TEST_MESSAGE_WITH_PAYLOAD',
            payload: dispatchedpayload,
            meta: plainMeta({
                to: actor.id,
            }),
        }
        system.dispatch([testMutationMessage])
        await delay(1) // allow the ActorFn to execute

        expect(dispatchedpayload).toStrictEqual({ string: 'not mutated' })
        expect(messageLog).toHaveLength(1)
        expect(JSON.parse(messageLog[0] as string)).toStrictEqual({
            type: 'TEST_MESSAGE_WITH_PAYLOAD',
            payload: { string: 'not mutated' },
            meta: {
                id: 'MOCK_ID_1',
                cat: 'P',
                to: 'TEST_ACTOR',
            },
        })
    })

    test('queries', async () => {
        const messageLog: string[] = []
        const unexpectedMessageLog: string[] = []

        const TEST_ACTOR_ID = 'TEST_ACTOR'

        const actorFn: ActorFn<null, TestQueryMessage> = async ({
            msg,
            dispatch,
        }) => {
            if (msg.type === 'TEST_QUERY') {
                messageLog.push(JSON.stringify(msg))
                const testResponseMessage: TestResponseMessage = {
                    type: 'TEST_RESPONSE',
                    payload: { string: 'test response' },
                    meta: responseMetaTo(msg.meta),
                }
                dispatch([testResponseMessage])
                return null
            } else {
                unexpectedMessageLog.push(JSON.stringify(msg))
                return null
            }
        }

        const system = initSystem()
        system.spawn({
            id: TEST_ACTOR_ID,
            fn: actorFn,
            initialState: null,
        })

        const { type: responseType, payload: responsepayload } =
            await system.query<TestQueryMessage, TestResponseMessage>({
                id: TEST_ACTOR_ID,
                type: 'TEST_QUERY',
                payload: { string: 'test query' },
            })

        expect(responseType).toBe('TEST_RESPONSE')
        expect(responsepayload).toStrictEqual({ string: 'test response' })
        expect(messageLog).toHaveLength(1)
        expect(unexpectedMessageLog).toHaveLength(0)
        expect(JSON.parse(messageLog[0] as string)).toStrictEqual({
            type: 'TEST_QUERY',
            payload: { string: 'test query' },
            meta: {
                id: 'MOCK_ID_1',
                cat: 'Q',
                to: 'TEST_ACTOR',
                rsvp: 'MOCK_ID_2',
            },
        })
    })

    test('query timeouts', async () => {
        const messageLog: string[] = []
        const unexpectedMessageLog: string[] = []

        const TEST_ACTOR_ID = 'TEST_ACTOR'

        const actorFn: ActorFn<null, TestQueryMessage> = async ({
            msg,
            dispatch,
        }) => {
            if (msg.type === 'TEST_QUERY') {
                messageLog.push(JSON.stringify(msg))
                await delay(10)
                const testResponseMessage: TestResponseMessage = {
                    type: 'TEST_RESPONSE',
                    payload: { string: 'test response' },
                    meta: responseMetaTo(msg.meta),
                }
                dispatch([testResponseMessage]) // NOTE: this should not be delivered
                return null
            } else {
                unexpectedMessageLog.push(JSON.stringify(msg))
                return null
            }
        }

        const system = initSystem()
        system.spawn({
            id: TEST_ACTOR_ID,
            fn: actorFn,
            initialState: null,
        })

        expect(
            system.query<TestQueryMessage, TestResponseMessage>({
                id: TEST_ACTOR_ID,
                type: 'TEST_QUERY',
                payload: { string: 'test query' },
                options: { timeout: 5 },
            }),
        ).rejects.toThrow('Query timed out.')

        await delay(15)

        expect(messageLog).toHaveLength(1)
        expect(unexpectedMessageLog).toHaveLength(0)
        expect(JSON.parse(messageLog[0] as string)).toStrictEqual({
            type: 'TEST_QUERY',
            payload: { string: 'test query' },
            meta: {
                id: 'MOCK_ID_1',
                cat: 'Q',
                to: 'TEST_ACTOR',
                rsvp: 'MOCK_ID_2',
            },
        })
    })

    test('async execution order', async () => {
        const messageLog: string[] = []
        const unexpectedMessageLog: string[] = []
        const eventLog: string[] = []

        const TEST_ACTOR_ID = 'TEST_ACTOR'

        const actorFn: ActorFn<null, TestQueryMessage | TestMessage> = async ({
            msg,
            dispatch,
        }) => {
            if (msg.type === 'TEST_MESSAGE') {
                messageLog.push(JSON.stringify(msg))
                eventLog.push('4: first message processed')
                return null
            } else if (msg.type === 'TEST_QUERY') {
                messageLog.push(JSON.stringify(msg))
                if (msg.payload.string === 'slow') {
                    eventLog.push('5: slow query starts processing')
                    await delay(10)
                    eventLog.push('6: slow query finishes processing')
                }
                if (msg.payload.string === 'fast') {
                    eventLog.push('7: fast query processed')
                }
                const testResponseMessage: TestResponseMessage = {
                    type: 'TEST_RESPONSE',
                    payload: { string: `${msg.payload.string} response` },
                    meta: responseMetaTo(msg.meta),
                }
                dispatch([testResponseMessage])
                return null
            } else {
                unexpectedMessageLog.push(JSON.stringify(msg))
                return null
            }
        }

        const system = initSystem()
        system.spawn({
            id: TEST_ACTOR_ID,
            fn: actorFn,
            initialState: null,
        })

        const testMessage: TestMessage = {
            type: 'TEST_MESSAGE',
            payload: null,
            meta: plainMeta({
                to: TEST_ACTOR_ID,
            }),
        }
        system.dispatch([testMessage])
        eventLog.push('1: plain message dispatched')

        const slowResponsePromise = system.query<
            TestQueryMessage,
            TestResponseMessage
        >({
            id: TEST_ACTOR_ID,
            type: 'TEST_QUERY',
            payload: { string: 'slow' },
        })
        eventLog.push('2: slow query message dispatched')

        const fastResponsePromise = system.query<
            TestQueryMessage,
            TestResponseMessage
        >({
            id: TEST_ACTOR_ID,
            type: 'TEST_QUERY',
            payload: { string: 'fast' },
        })
        eventLog.push('3: fast query message dispatched')

        const { type: slowResponseType, payload: slowResponsePayload } =
            await slowResponsePromise
        eventLog.push('8: slow query response received')

        const { type: fastResponseType, payload: fastResponsePayload } =
            await fastResponsePromise
        eventLog.push('9: fast query response received')

        expect(slowResponseType).toBe('TEST_RESPONSE')
        expect(slowResponsePayload).toStrictEqual({ string: 'slow response' })
        expect(fastResponseType).toBe('TEST_RESPONSE')
        expect(fastResponsePayload).toStrictEqual({ string: 'fast response' })

        expect(messageLog).toHaveLength(3)
        expect(JSON.parse(messageLog[0] as string)).toStrictEqual({
            type: 'TEST_MESSAGE',
            payload: null,
            meta: {
                id: 'MOCK_ID_1',
                cat: 'P',
                to: 'TEST_ACTOR',
            },
        })
        expect(JSON.parse(messageLog[1] as string)).toStrictEqual({
            type: 'TEST_QUERY',
            payload: { string: 'slow' },
            meta: {
                id: 'MOCK_ID_2',
                cat: 'Q',
                to: 'TEST_ACTOR',
                rsvp: 'MOCK_ID_3',
            },
        })
        expect(JSON.parse(messageLog[2] as string)).toStrictEqual({
            type: 'TEST_QUERY',
            payload: { string: 'fast' },
            meta: {
                id: 'MOCK_ID_4',
                cat: 'Q',
                to: 'TEST_ACTOR',
                rsvp: 'MOCK_ID_5',
            },
        })

        expect(eventLog).toStrictEqual([
            '1: plain message dispatched',
            '2: slow query message dispatched',
            '3: fast query message dispatched',
            '4: first message processed',
            '5: slow query starts processing',
            '6: slow query finishes processing',
            '7: fast query processed',
            '8: slow query response received',
            '9: fast query response received',
        ])
    })
})
