import { initSystem } from './system'
import { message, responseTo } from './util/messageTemplates'
import { ActorFn } from './actor'
import { SimpleMessageMeta, QueryMessageMeta } from './types'

jest.mock('./util/uniqueId', () => ({
    uniqueId: (() => {
        let index = 1
        return () => `MOCK_ID_${index++}`
    })(),
}))

const delay = (millis: number) =>
    new Promise((resolve) => setTimeout(resolve, millis))

type TestMutationMessage = {
    type: 'TEST_MUTATION'
    cat: 'NRE'
    payload: Record<string, string>
    meta: SimpleMessageMeta
}

type TestQueryMessage = {
    type: 'TEST_QUERY'
    cat: 'Q'
    payload: Record<string, string>
    meta: QueryMessageMeta
}

// NOTE: one clump of an integration test
// written as one to save some time on code I already tested, used and know
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
        if (msg.type === 'TEST_MUTATION' && msg.payload && msg.cat === 'NRE') {
            eventLog.push(4)
            expectedMessageLog.push(JSON.stringify(msg))
            // should not mutate values outside actor function context
            msg.payload['string'] = 'mutated'
            // processing should be
            await delay(100)
            eventLog.push(5)
            return null
        } else if (
            msg.type === 'TEST_QUERY' &&
            msg.payload &&
            msg.cat === 'Q'
        ) {
            eventLog.push(6)
            expectedMessageLog.push(JSON.stringify(msg))
            dispatch([
                responseTo({
                    msg,
                    type: 'TEST_RESPONSE',
                    payload: { string: 'test response' },
                }),
            ])
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
    // test NRE message and make sure actors cannot mutate source message references
    const dispatchedpayload = { string: 'not mutated' }
    system.dispatch([
        message({
            to: actor.id,
            type: 'TEST_MUTATION',
            payload: dispatchedpayload,
        }),
    ])
    eventLog.push(2)

    // test query functionality and response message payload
    const responsePromise = system.query({
        id: TEST_ACTOR_ID,
        type: 'TEST_QUERY',
        payload: { string: 'test query' },
    })
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
        cat: 'NRE',
        payload: { string: 'not mutated' },
        meta: {
            id: 'MOCK_ID_1',
            to: 'TEST_ACTOR',
        },
    })
    expect(JSON.parse(expectedMessageLog[1] as string)).toStrictEqual({
        type: 'TEST_QUERY',
        cat: 'Q',
        payload: { string: 'test query' },
        meta: {
            id: 'MOCK_ID_2',
            to: 'TEST_ACTOR',
            rsvp: 'MOCK_ID_3',
        },
    })

    expect(dispatchedpayload).toStrictEqual({ string: 'not mutated' })
    expect(unexpectedMessageLog.length).toBe(0)
    // see the order of `eventLog.push`es
    expect(eventLog).toStrictEqual([1, 2, 3, 4, 5, 6, 7])
})
