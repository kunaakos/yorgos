import { ActorId, ActorSystemId } from 'src/types/base'
import { DispatchFn } from 'src/types/system'

export type MembershipChangeFn = (actorIds: ActorId[]) => void

export type Downlink = {
    systemId: ActorSystemId
    dispatch: DispatchFn
    disconnect: () => void
}

export type Uplink = {
    dispatch: DispatchFn
    publish: MembershipChangeFn
    unpublish: MembershipChangeFn
    disconnect: () => void
}

export type LinkFn = (downlink: Downlink) => Uplink | null

export type Router = {
    link: LinkFn
}

export type TransportHost = {
    stop: () => Promise<void>
}

export type TransportClient = {
    stop: () => Promise<void>
    link: LinkFn
}

export type InitTransportHostFn<Options> = (
    args: {
        link: LinkFn
    } & Options,
) => Promise<TransportHost>

export type InitTransportClientFn<Options> = (
    args: Options,
) => Promise<TransportClient>
