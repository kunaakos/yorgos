import { ActorId, ActorSystemId } from 'src/types/base'
import { Downlink, Router, Uplink } from 'src/types/remoting'

export type Downlinks = Record<ActorSystemId, Downlink>
export type Uplinks = Record<ActorSystemId, Uplink>

export const mockRouterLinks = ({
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
            disconnect: jest.fn(),
        }
        const uplink = router.link(downlink)
        if (!uplink) throw new Error()
        const mockActorIds: string[] = actorSuffixes.map(
            (actorSuffix) => `${systemId}${actorSuffix}`,
        )
        uplink.publish(mockActorIds)
        downlinks[systemId] = downlink
        uplinks[systemId] = uplink
    })
    return { uplinks, downlinks }
}
