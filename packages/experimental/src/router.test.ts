import { initRouter } from 'src/router'
import { plainTestMessageTo } from 'src/util.test/messageTemplates'
import { mockRouterLinks } from 'src/util.test/mockRouterLinks'

describe('router', () => {
    test('should discard messages addressed to unpublished actors', () => {
        const router = initRouter()
        const dispatch = jest.fn()
        const destroy = jest.fn()
        const uplink = router.link({
            dispatch,
            systemId: 'TEST',
            disconnect: destroy,
        })
        if (!uplink) throw new Error()
        uplink.dispatch(plainTestMessageTo('nobody in particular'))
        expect(dispatch).toHaveBeenCalledTimes(0)
        expect(destroy).toHaveBeenCalledTimes(0)
    })

    test('should route messages to the correct links', () => {
        const router = initRouter()

        const { uplinks, downlinks } = mockRouterLinks({
            router,
            systemIds: ['A', 'B', 'C'],
            actorSuffixes: ['1', '2', '3'],
        })

        if (uplinks['A'] && uplinks['B'] && uplinks['C']) {
            uplinks['A'].dispatch(plainTestMessageTo('B1'))
            uplinks['A'].dispatch(plainTestMessageTo('B2'))
            uplinks['B'].dispatch(plainTestMessageTo('C3'))
            uplinks['C'].dispatch(plainTestMessageTo('A1'))
        } else {
            throw new Error("well, that's unexpected")
        }

        expect(downlinks['A']?.dispatch).toHaveBeenCalledWith(
            plainTestMessageTo('A1'),
        )
        expect(downlinks['B']?.dispatch).toHaveBeenCalledTimes(2)
        expect(downlinks['B']?.dispatch).toHaveBeenLastCalledWith(
            plainTestMessageTo('B2'),
        )
        expect(downlinks['C']?.dispatch).toHaveBeenCalledWith(
            plainTestMessageTo('C3'),
        )
    })

    // NOTE: could be broken down into several smaller cases, but is efficient as is
    test('should destroy connections that cause ActorId collisions and keep functioning', () => {
        const router = initRouter()

        const { uplinks, downlinks } = mockRouterLinks({
            router,
            systemIds: ['AX', 'B', 'CX', 'D'],
            actorSuffixes: ['1', '2', '3'],
        })

        // AX and BX should be disconnected
        uplinks['AX']?.publish(['AX1'])
        uplinks['CX']?.publish(['CX3'])

        expect(downlinks['AX']?.disconnect).toHaveBeenCalledTimes(1)
        expect(downlinks['B']?.disconnect).toHaveBeenCalledTimes(0)
        expect(downlinks['CX']?.disconnect).toHaveBeenCalledTimes(1)
        expect(downlinks['D']?.disconnect).toHaveBeenCalledTimes(0)

        // test if the rest are ok
        uplinks['B']?.dispatch(plainTestMessageTo('D2'))
        expect(downlinks['D']?.dispatch).toHaveBeenCalledTimes(1)
        expect(downlinks['D']?.dispatch).toHaveBeenCalledWith(
            plainTestMessageTo('D2'),
        )

        // test messaging from live system to dead one
        uplinks['B']?.dispatch(plainTestMessageTo('AX1'))
        expect(downlinks['AX']?.dispatch).toHaveBeenCalledTimes(0)

        // test messaging from dead system to live one
        uplinks['AX']?.dispatch(plainTestMessageTo('B1'))
        expect(downlinks['B']?.dispatch).toHaveBeenCalledTimes(0)
    })
})
