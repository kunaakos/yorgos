import { Mock, beforeEach, describe, expect, test, vi } from 'vitest'

import { ActorFn } from 'src/types/actor'
import { PlainMessage, QueryMessage, ResponseMessage } from 'src/types/message'

import { plainMeta, responseMetaTo } from 'src/util/metaTemplates'
import { mockUniqueId } from 'src/util/test/uniqueId'
import { uuidV7 } from 'src/util/uniqueId'

import { makeSystem } from 'src/system'

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

vi.mock('src/util/uniqueId', () => {
    return {
        uuidV7: vi.fn(() => `MOCK_UUIDV7`),
    }
})

describe('actor system', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    test('messaging', async () => {
        const messageLog: string[] = []

        const TEST_ACTOR_ID = 'TEST_ACTOR'
        const TEST_SYSTEM_ID = 'TEST_SYSTEM'

        const actorFn: ActorFn<TestMessageWithPayload> = ({ msg }) => {
            messageLog.push(JSON.stringify(msg))
            return null
        }

        const system = makeSystem({
            id: TEST_SYSTEM_ID,
            uniqueId: mockUniqueId(),
        })
        const actor = system.spawnStateless({
            id: TEST_ACTOR_ID,
            fn: actorFn,
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
                mid: 'MOCK_UUIDV7',
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

        const actorFn: ActorFn<TestQueryMessageWithPayload> = async ({
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

        const system = makeSystem({
            id: TEST_SYSTEM_ID,
            uniqueId: mockUniqueId(),
        })
        system.spawnStateless({
            id: TEST_ACTOR_ID,
            fn: actorFn,
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
                mid: 'MOCK_UUIDV7',
                cat: 'Q',
                to: 'TEST_ACTOR',
                rsvp: 'MOCK_ACTOR_ID_1',
            },
        })
    })

    test('query timeouts', async () => {
        const messageLog: string[] = []
        const unexpectedMessageLog: string[] = []

        const TEST_ACTOR_ID = 'TEST_ACTOR'
        const TEST_SYSTEM_ID = 'TEST_SYSTEM'

        const actorFn: ActorFn<TestQueryMessageWithPayload> = async ({
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

        const system = makeSystem({
            id: TEST_SYSTEM_ID,
            uniqueId: mockUniqueId(),
        })
        system.spawnStateless({
            id: TEST_ACTOR_ID,
            fn: actorFn,
        })

        await expect(
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
                mid: 'MOCK_UUIDV7',
                cat: 'Q',
                to: 'TEST_ACTOR',
                rsvp: 'MOCK_ACTOR_ID_1',
            },
        })
    })

    test('actor concurrency', async () => {
        const eventLog: string[] = []
        const queries: Promise<any>[] = []

        const TEST_SYSTEM_ID = 'TEST_SYSTEM'

        const actorFn: ActorFn<TestMessage> = () => {
            eventLog.push('A')
            return null
        }

        const asyncActorFn: ActorFn<TestMessage> = async () => {
            eventLog.push('B')
            return null
        }

        const slowActorFn: ActorFn<TestQueryMessageWithPayload> = async ({
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

        const system = makeSystem({
            id: TEST_SYSTEM_ID,
            uniqueId: mockUniqueId(),
        })
        system.spawnStateless({
            id: '1',
            fn: actorFn,
        })
        system.spawnStateless({
            id: '2',
            fn: asyncActorFn,
        })
        system.spawnStateless({
            id: '3',
            fn: slowActorFn,
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
                    meta: responseMetaTo(msg.meta), // calls `uuidV7`, should be called twice
                }
                dispatch(testResponseMessage)
                return null
            } else {
                unexpectedMessageLog.push(JSON.stringify(msg))
                return null
            }
        }

        const system = makeSystem({
            id: TEST_SYSTEM_ID,
            uniqueId: mockUniqueId(),
        })

        const uuidMock = uuidV7 as Mock
        uuidMock.mockImplementation(mockUniqueId('MOCK_MSG_UUID'))

        system.spawnStateless({
            id: TEST_ACTOR_ID,
            fn: actorFn,
        })

        const testMessage: TestMessage = {
            type: 'TEST_MESSAGE',
            payload: null,
            meta: plainMeta({
                // calls `uuidV7`
                to: TEST_ACTOR_ID,
            }),
        }
        system.dispatch(testMessage)
        eventLog.push('1: plain message dispatched')

        // query calls `uuidV7`
        const slowResponsePromise = system.query<
            TestQueryMessageWithPayload,
            TestResponseMessageWithPayload
        >({
            id: TEST_ACTOR_ID,
            type: 'TEST_QUERY_WITH_PAYLOAD',
            payload: { string: 'slow' },
        })
        eventLog.push('2: slow query message dispatched')

        // query calls `uuidV7`
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
                mid: 'MOCK_MSG_UUID_1',
                cat: 'P',
                to: 'TEST_ACTOR',
            },
        })
        expect(JSON.parse(messageLog[1] as string)).toStrictEqual({
            type: 'TEST_QUERY_WITH_PAYLOAD',
            payload: { string: 'slow' },
            meta: {
                mid: 'MOCK_MSG_UUID_2',
                cat: 'Q',
                to: 'TEST_ACTOR',
                rsvp: 'MOCK_ACTOR_ID_1',
            },
        })
        expect(JSON.parse(messageLog[2] as string)).toStrictEqual({
            type: 'TEST_QUERY_WITH_PAYLOAD',
            payload: { string: 'fast' },
            meta: {
                mid: 'MOCK_MSG_UUID_3',
                cat: 'Q',
                to: 'TEST_ACTOR',
                rsvp: 'MOCK_ACTOR_ID_2',
            },
        })

        expect(messageLog.length).toBe(3)
        expect(uuidMock).toBeCalledTimes(5) // two queries + 3 message meta template calls

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
