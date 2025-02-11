import { initRouter } from './router'
import { ActorId, ActorSystemId } from './types/base'
import { PlainMessage } from './types/message'
import { Downlink, Router, Uplink } from './types/remoting'

const testMessageTo = (to: ActorId): PlainMessage => ({
    type: 'X',
    payload: null,
    meta: { id: '#', cat: 'P', to },
})

type Downlinks = Record<ActorSystemId, Downlink>
type Uplinks = Record<ActorSystemId, Uplink>

const mockSystem = ({
    router,
    systemIds,
    actorSuffixes,
}: {
    router: Router
    systemIds: ActorSystemId[]
    actorSuffixes: ActorId[]
}): {
    uplinks: Uplinks
    downlinks: Downlinks
} => {
    const downlinks: Downlinks = {}
    const uplinks: Uplinks = {}
    systemIds.forEach((systemId) => {
        const downlink = {
            systemId,
            dispatch: jest.fn(),
            onDestroyed: jest.fn(),
        }
        const uplink = router.createLink(downlink)
        const mockActorIds: string[] = actorSuffixes.map(
            (actorSuffix) => `${systemId}${actorSuffix}`,
        )
        uplink.publish(mockActorIds)
        downlinks[systemId] = downlink
        uplinks[systemId] = uplink
    })
    return { uplinks, downlinks }
}

describe('router', () => {
    test('should discard messages addressed to unpublished actors', () => {
        const router = initRouter()
        const dispatch = jest.fn()
        const onDestroyed = jest.fn()
        const uplink = router.createLink({
            dispatch,
            systemId: 'TEST',
            onDestroyed,
        })
        uplink.dispatch(testMessageTo('nobody in particular'))
        expect(dispatch).toHaveBeenCalledTimes(0)
        expect(onDestroyed).toHaveBeenCalledTimes(0)
    })

    test('should route messages to the correct links', () => {
        const router = initRouter()

        const { uplinks, downlinks } = mockSystem({
            router,
            systemIds: ['A', 'B', 'C'],
            actorSuffixes: ['1', '2', '3'],
        })

        if (uplinks['A'] && uplinks['B'] && uplinks['C']) {
            uplinks['A'].dispatch(testMessageTo('B1'))
            uplinks['A'].dispatch(testMessageTo('B2'))
            uplinks['B'].dispatch(testMessageTo('C3'))
            uplinks['C'].dispatch(testMessageTo('A1'))
        } else {
            throw new Error("well, that's unexpected")
        }

        expect(downlinks['A']?.dispatch).toHaveBeenCalledWith(
            testMessageTo('A1'),
        )
        expect(downlinks['B']?.dispatch).toHaveBeenCalledTimes(2)
        expect(downlinks['B']?.dispatch).toHaveBeenLastCalledWith(
            testMessageTo('B2'),
        )
        expect(downlinks['C']?.dispatch).toHaveBeenCalledWith(
            testMessageTo('C3'),
        )
    })

    // NOTE: could be broken down into several smaller cases, but is efficient as is
    test('should destroy connections that cause ActorId collisions and keep functioning', () => {
        const router = initRouter()

        const { uplinks, downlinks } = mockSystem({
            router,
            systemIds: ['AX', 'B', 'CX', 'D'],
            actorSuffixes: ['1', '2', '3'],
        })

        // AX and BX should be disconnected
        uplinks['AX']?.publish(['AX1'])
        uplinks['CX']?.publish(['CX3'])

        expect(downlinks['AX']?.onDestroyed).toHaveBeenCalledTimes(1)
        expect(downlinks['B']?.onDestroyed).toHaveBeenCalledTimes(0)
        expect(downlinks['CX']?.onDestroyed).toHaveBeenCalledTimes(1)
        expect(downlinks['D']?.onDestroyed).toHaveBeenCalledTimes(0)

        // test if the rest are ok
        uplinks['B']?.dispatch(testMessageTo('D2'))
        expect(downlinks['D']?.dispatch).toHaveBeenCalledTimes(1)
        expect(downlinks['D']?.dispatch).toHaveBeenCalledWith(
            testMessageTo('D2'),
        )

        // test messaging from live system to dead one
        uplinks['B']?.dispatch(testMessageTo('AX1'))
        expect(downlinks['AX']?.dispatch).toHaveBeenCalledTimes(0)

        // test messaging from dead system to live one
        uplinks['AX']?.dispatch(testMessageTo('B1'))
        expect(downlinks['B']?.dispatch).toHaveBeenCalledTimes(0)
    })
})
