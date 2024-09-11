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
        if (msg.type === 'TEST_MUTATION') {
            eventLog.push(4)
            expectedMessageLog.push(cloneDeep(msg))
            // should not mutate values outside actor function context
            msg.content['string'] = 'mutated'
            // processing should be
            await delay(100)
            eventLog.push(5)
            return null
        } else if (msg.type === 'TEST_QUERY' && msg.cat === 'Q') {
            eventLog.push(6)
            expectedMessageLog.push(msg)
            dispatch([
                responseTo({
                    msg,
                    type: 'TEST_RESPONSE',
                    content: { string: 'test response' },
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
    const dispatchedContent = { string: 'not mutated' }
    system.dispatch([
        message({
            to: actor.id,
            type: 'TEST_MUTATION',
            content: dispatchedContent,
        }),
    ])
    eventLog.push(2)

    // test query functionality and response message content
    const responsePromise = system.query({
        id: TEST_ACTOR_ID,
        type: 'TEST_QUERY',
        content: { string: 'test query' },
    })
    eventLog.push(3)

    const responseContent = await responsePromise
    eventLog.push(7)
    expect(responseContent).toStrictEqual({ string: 'test response' })

    // messages received by the actor should be logged and their original order kept
    expect(expectedMessageLog).toHaveLength(2)
    expect(expectedMessageLog[0]).toStrictEqual({
        id: 'MOCK_ID',
        type: 'TEST_MUTATION',
        cat: 'NRE',
        to: 'TEST_ACTOR',
        content: { string: 'not mutated' },
    })
    expect(expectedMessageLog[1]).toStrictEqual({
        id: 'MOCK_ID',
        type: 'TEST_QUERY',
        cat: 'Q',   
        to: 'TEST_ACTOR',
        rsvp: 'MOCK_ID',
        content: { string: 'test query' },
    })

    expect(dispatchedContent).toStrictEqual({ string: 'not mutated' })
    expect(unexpectedMessageLog.length).toBe(0)
    // see the order of `eventLog.push`es
    expect(eventLog).toStrictEqual([1, 2, 3, 4, 5, 6, 7])
})
