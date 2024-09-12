import { cloneDeep } from 'lodash'
import { initSystem } from './system'
import { message, responseTo } from './messageTemplates'
import { ActorFn } from './actor'

jest.mock('./util')

const delay = (millis: number) =>
    new Promise((resolve) => setTimeout(resolve, millis))

// NOTE: one clump of an integration test
// written as one to save some time on code I already tested, used and know
test('actor system quicktest', async () => {
    const { generateRandomId } = await import('./util')
    //@ts-ignore
    generateRandomId.mockReturnValue('MOCK_ID')

    const expectedMessageLog: unknown[] = []
    const unexpectedMessageLog: unknown[] = []
    const eventLog: number[] = []
    const system = initSystem()
    const TEST_ACTOR_ID = 'TEST_ACTOR'

    const asyncActorFn: ActorFn<null> = async ({ msg, dispatch }) => {
        if (msg.type === 'TEST_MUTATION' && msg.payload && msg.cat === 'NRE') {
            eventLog.push(4)
            expectedMessageLog.push(cloneDeep(msg))
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
            msg
            eventLog.push(6)
            expectedMessageLog.push(msg)
            dispatch([
                responseTo({
                    msg,
                    type: 'TEST_RESPONSE',
                    payload: { string: 'test response' },
                }),
            ])
            return null
        } else {
            unexpectedMessageLog.push(msg)
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

    const responsepayload = await responsePromise
    eventLog.push(7)
    expect(responsepayload).toStrictEqual({ string: 'test response' })

    // messages received by the actor should be logged and their original order kept
    expect(expectedMessageLog).toHaveLength(2)
    expect(expectedMessageLog[0]).toStrictEqual({
        type: 'TEST_MUTATION',
        cat: 'NRE',
        payload: { string: 'not mutated' },
        meta: {
            id: 'MOCK_ID',
            to: 'TEST_ACTOR',
        },
    })
    expect(expectedMessageLog[1]).toStrictEqual({
        type: 'TEST_QUERY',
        cat: 'Q',
        payload: { string: 'test query' },
        meta: {
            id: 'MOCK_ID',
            to: 'TEST_ACTOR',
            rsvp: 'MOCK_ID',
        },
    })

    expect(dispatchedpayload).toStrictEqual({ string: 'not mutated' })
    expect(unexpectedMessageLog.length).toBe(0)
    // see the order of `eventLog.push`es
    expect(eventLog).toStrictEqual([1, 2, 3, 4, 5, 6, 7])
})
