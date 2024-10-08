import { ActorFn } from 'src/types/actor'

import { plainMeta, responseMetaTo } from 'src/util/metaTemplates'

import { initSystem } from 'src/system'

import { PlainMessage, QueryMessage, ResponseMessage } from 'src/types/message'

jest.mock('src/util/uniqueId', () => ({
    uniqueId: (() => {
        let index = 1
        return () => `MOCK_ID_${index++}`
    })(),
}))

const delay = (millis: number) =>
    new Promise((resolve) => setTimeout(resolve, millis))

type TestMutationMessage = PlainMessage<
    'TEST_MUTATION', //
    { string: string } //
>

type TestQueryMessage = QueryMessage<
    'TEST_QUERY', //
    { string: 'test query' } //
>

type TestResponseMessage = ResponseMessage<
    'TEST_RESPONSE', //
    { string: 'test response' } //
>

test('actor system quicktest', async () => {
    const expectedMessageLog: string[] = []
    const unexpectedMessageLog: string[] = []
    const eventLog: number[] = []
    const system = initSystem()
    const TEST_ACTOR_ID = 'TEST_ACTOR'

    const asyncActorFn: ActorFn<
        null,
        TestMutationMessage | TestQueryMessage
    > = async ({ msg, dispatch }) => {
        if (msg.type === 'TEST_MUTATION') {
            eventLog.push(4)
            expectedMessageLog.push(JSON.stringify(msg))
            // should not mutate values outside actor function context
            msg.payload['string'] = 'mutated'
            // processing should be
            await delay(100)
            eventLog.push(5)
            return null
        } else if (msg.type === 'TEST_QUERY') {
            eventLog.push(6)
            expectedMessageLog.push(JSON.stringify(msg))
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

    const actor = system.spawn({
        id: TEST_ACTOR_ID,
        fn: asyncActorFn,
        initialState: null,
    })

    eventLog.push(1)
    // test P message and make sure actors cannot mutate source message references
    const dispatchedpayload = { string: 'not mutated' }
    const testMutationMessage: TestMutationMessage = {
        type: 'TEST_MUTATION',
        payload: dispatchedpayload,
        meta: plainMeta({
            to: actor.id,
        }),
    }
    system.dispatch([testMutationMessage])
    eventLog.push(2)

    // test query functionality and response message payload
    const responsePromise = system.query<TestQueryMessage, TestResponseMessage>(
        {
            id: TEST_ACTOR_ID,
            type: 'TEST_QUERY',
            payload: { string: 'test query' },
        },
    )
    eventLog.push(3)

    const { type: responseType, payload: responsepayload } =
        await responsePromise
    eventLog.push(7)
    expect(responseType).toBe('TEST_RESPONSE')
    expect(responsepayload).toStrictEqual({ string: 'test response' })

    // messages received by the actor should be logged and their original order kept
    expect(expectedMessageLog).toHaveLength(2)
    expect(JSON.parse(expectedMessageLog[0] as string)).toStrictEqual({
        type: 'TEST_MUTATION',
        payload: { string: 'not mutated' },
        meta: {
            id: 'MOCK_ID_1',
            cat: 'P',
            to: 'TEST_ACTOR',
        },
    })
    expect(JSON.parse(expectedMessageLog[1] as string)).toStrictEqual({
        type: 'TEST_QUERY',
        payload: { string: 'test query' },
        meta: {
            id: 'MOCK_ID_2',
            cat: 'Q',
            to: 'TEST_ACTOR',
            rsvp: 'MOCK_ID_3',
        },
    })

    expect(dispatchedpayload).toStrictEqual({ string: 'not mutated' })
    expect(unexpectedMessageLog.length).toBe(0)
    // see the order of `eventLog.push`es
    expect(eventLog).toStrictEqual([1, 2, 3, 4, 5, 6, 7])
})
