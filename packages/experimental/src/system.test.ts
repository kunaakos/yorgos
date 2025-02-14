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
    null //
>

type TestQueryMessageWithPayload = QueryMessage<
    'TEST_QUERY_WITH_PAYLOAD', //
    { string: string } //
>

type TestResponseMessage = ResponseMessage<
    'TEST_RESPONSE', //
    null //
>

type TestResponseMessageWithPayload = ResponseMessage<
    'TEST_RESPONSE_WITH_PAYLOAD', //
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
        const TEST_SYSTEM_ID = 'TEST_SYSTEM'

        const actorFn: ActorFn<null, TestMessageWithPayload> = ({ msg }) => {
            messageLog.push(JSON.stringify(msg))
            return null
        }

        const system = initSystem({ id: TEST_SYSTEM_ID })
        const actor = system.spawn({
            id: TEST_ACTOR_ID,
            fn: actorFn,
            initialState: null,
        })

        system.dispatch({
            type: 'TEST_MESSAGE_WITH_PAYLOAD',
            payload: { string: 'hi! how are you?' },
            meta: plainMeta({
                to: actor.id,
            }),
        })
        await delay(1) // allow the ActorFn to execute

        expect(messageLog).toHaveLength(1)
        expect(JSON.parse(messageLog[0] as string)).toStrictEqual({
            type: 'TEST_MESSAGE_WITH_PAYLOAD',
            payload: { string: 'hi! how are you?' },
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
        const TEST_SYSTEM_ID = 'TEST_SYSTEM'

        const actorFn: ActorFn<null, TestQueryMessageWithPayload> = async ({
            msg,
            dispatch,
        }) => {
            if (msg.type === 'TEST_QUERY_WITH_PAYLOAD') {
                messageLog.push(JSON.stringify(msg))
                const testResponseMessage: TestResponseMessageWithPayload = {
                    type: 'TEST_RESPONSE_WITH_PAYLOAD',
                    payload: { string: 'test response' },
                    meta: responseMetaTo(msg.meta),
                }
                dispatch(testResponseMessage)
                return null
            } else {
                unexpectedMessageLog.push(JSON.stringify(msg))
                return null
            }
        }

        const system = initSystem({ id: TEST_SYSTEM_ID })
        system.spawn({
            id: TEST_ACTOR_ID,
            fn: actorFn,
            initialState: null,
        })

        const { type: responseType, payload: responsepayload } =
            await system.query<
                TestQueryMessageWithPayload,
                TestResponseMessageWithPayload
            >({
                id: TEST_ACTOR_ID,
                type: 'TEST_QUERY_WITH_PAYLOAD',
                payload: { string: 'test query' },
            })

        expect(responseType).toBe('TEST_RESPONSE_WITH_PAYLOAD')
        expect(responsepayload).toStrictEqual({ string: 'test response' })
        expect(messageLog).toHaveLength(1)
        expect(unexpectedMessageLog).toHaveLength(0)
        expect(JSON.parse(messageLog[0] as string)).toStrictEqual({
            type: 'TEST_QUERY_WITH_PAYLOAD',
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
        const TEST_SYSTEM_ID = 'TEST_SYSTEM'

        const actorFn: ActorFn<null, TestQueryMessageWithPayload> = async ({
            msg,
            dispatch,
        }) => {
            if (msg.type === 'TEST_QUERY_WITH_PAYLOAD') {
                messageLog.push(JSON.stringify(msg))
                await delay(10)
                const testResponseMessage: TestResponseMessageWithPayload = {
                    type: 'TEST_RESPONSE_WITH_PAYLOAD',
                    payload: { string: 'test response' },
                    meta: responseMetaTo(msg.meta),
                }
                dispatch(testResponseMessage) // NOTE: this should not be delivered
                return null
            } else {
                unexpectedMessageLog.push(JSON.stringify(msg))
                return null
            }
        }

        const system = initSystem({ id: TEST_SYSTEM_ID })
        system.spawn({
            id: TEST_ACTOR_ID,
            fn: actorFn,
            initialState: null,
        })

        expect(
            system.query<
                TestQueryMessageWithPayload,
                TestResponseMessageWithPayload
            >({
                id: TEST_ACTOR_ID,
                type: 'TEST_QUERY_WITH_PAYLOAD',
                payload: { string: 'test query' },
                options: { timeout: 5 },
            }),
        ).rejects.toThrow('Query timed out.')

        await delay(15) // NOTE: replace timeouts with better promise-based control

        expect(messageLog).toHaveLength(1)
        expect(unexpectedMessageLog).toHaveLength(0)
        expect(JSON.parse(messageLog[0] as string)).toStrictEqual({
            type: 'TEST_QUERY_WITH_PAYLOAD',
            payload: { string: 'test query' },
            meta: {
                id: 'MOCK_ID_1',
                cat: 'Q',
                to: 'TEST_ACTOR',
                rsvp: 'MOCK_ID_2',
            },
        })
    })

    test('actor concurrency', async () => {
        const eventLog: string[] = []
        const queries: Promise<any>[] = []

        const TEST_SYSTEM_ID = 'TEST_SYSTEM'

        const actorFn: ActorFn<null, TestMessage> = () => {
            eventLog.push('A')
            return null
        }

        const asyncActorFn: ActorFn<null, TestMessage> = async () => {
            eventLog.push('B')
            return null
        }

        const slowActorFn: ActorFn<null, TestQueryMessageWithPayload> = async ({
            msg,
            dispatch,
        }) => {
            await delay(5)
            eventLog.push('C')
            const testResponseMessage: TestResponseMessage = {
                type: 'TEST_RESPONSE',
                payload: null,
                meta: responseMetaTo(msg.meta),
            }
            dispatch(testResponseMessage)
            return null
        }

        const system = initSystem({ id: TEST_SYSTEM_ID })
        system.spawn({
            id: '1',
            fn: actorFn,
            initialState: null,
        })
        system.spawn({
            id: '2',
            fn: asyncActorFn,
            initialState: null,
        })
        system.spawn({
            id: '3',
            fn: slowActorFn,
            initialState: null,
        })

        for (let i = 0; i <= 8; i++) {
            const actorIndex = i % 3
            const actorId = `${actorIndex + 1}`
            if (actorIndex === 2) {
                queries.push(
                    system.query<TestQueryMessage, TestResponseMessage>({
                        id: actorId,
                        type: 'TEST_QUERY',
                        payload: null,
                    }),
                )
            } else {
                system.dispatch({
                    type: 'TEST_MESSAGE',
                    payload: null,
                    meta: plainMeta({
                        to: actorId,
                    }),
                })
            }
        }

        eventLog.push('S') // "Start"
        await Promise.all(queries) // none should reject
        eventLog.push('E') // "End"

        expect(eventLog).toHaveLength(11)
        expect(eventLog.join('')).toBe('SABABABCCCE')
    })

    test('message processing concurrency', async () => {
        const messageLog: string[] = []
        const unexpectedMessageLog: string[] = []
        const eventLog: string[] = []

        const TEST_ACTOR_ID = 'TEST_ACTOR'
        const TEST_SYSTEM_ID = 'TEST_SYSTEM'

        const actorFn: ActorFn<
            null,
            TestQueryMessageWithPayload | TestMessage
        > = async ({ msg, dispatch }) => {
            if (msg.type === 'TEST_MESSAGE') {
                messageLog.push(JSON.stringify(msg))
                eventLog.push('4: plain message processed')
                return null
            } else if (msg.type === 'TEST_QUERY_WITH_PAYLOAD') {
                messageLog.push(JSON.stringify(msg))
                if (msg.payload.string === 'slow') {
                    eventLog.push('5: slow query starts processing')
                    await delay(5)
                    eventLog.push('6: slow query finishes processing')
                }
                if (msg.payload.string === 'fast') {
                    eventLog.push('8: fast query processed')
                }
                const testResponseMessage: TestResponseMessageWithPayload = {
                    type: 'TEST_RESPONSE_WITH_PAYLOAD',
                    payload: { string: `${msg.payload.string} response` },
                    meta: responseMetaTo(msg.meta),
                }
                dispatch(testResponseMessage)
                return null
            } else {
                unexpectedMessageLog.push(JSON.stringify(msg))
                return null
            }
        }

        const system = initSystem({ id: TEST_SYSTEM_ID })
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
        system.dispatch(testMessage)
        eventLog.push('1: plain message dispatched')

        const slowResponsePromise = system.query<
            TestQueryMessageWithPayload,
            TestResponseMessageWithPayload
        >({
            id: TEST_ACTOR_ID,
            type: 'TEST_QUERY_WITH_PAYLOAD',
            payload: { string: 'slow' },
        })
        eventLog.push('2: slow query message dispatched')

        const fastResponsePromise = system.query<
            TestQueryMessageWithPayload,
            TestResponseMessageWithPayload
        >({
            id: TEST_ACTOR_ID,
            type: 'TEST_QUERY_WITH_PAYLOAD',
            payload: { string: 'fast' },
        })
        eventLog.push('3: fast query message dispatched')

        const { type: slowResponseType, payload: slowResponsePayload } =
            await slowResponsePromise
        eventLog.push('7: slow query response received')

        const { type: fastResponseType, payload: fastResponsePayload } =
            await fastResponsePromise
        eventLog.push('9: fast query response received')

        expect(slowResponseType).toBe('TEST_RESPONSE_WITH_PAYLOAD')
        expect(slowResponsePayload).toStrictEqual({ string: 'slow response' })
        expect(fastResponseType).toBe('TEST_RESPONSE_WITH_PAYLOAD')
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
            type: 'TEST_QUERY_WITH_PAYLOAD',
            payload: { string: 'slow' },
            meta: {
                id: 'MOCK_ID_2',
                cat: 'Q',
                to: 'TEST_ACTOR',
                rsvp: 'MOCK_ID_3',
            },
        })
        expect(JSON.parse(messageLog[2] as string)).toStrictEqual({
            type: 'TEST_QUERY_WITH_PAYLOAD',
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
            '4: plain message processed',
            '5: slow query starts processing',
            '6: slow query finishes processing',
            '7: slow query response received',
            '8: fast query processed',
            '9: fast query response received',
        ])
    })
})
