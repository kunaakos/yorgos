import { ActorId, ActorSystemId } from 'src/types/base'
import { DispatchFn } from 'src/types/system'

export type MembershipChangeFn = (actorId: ActorId) => void // TODO: these should accept arrays

export type Downlink = {
    systemId: ActorSystemId
    dispatch: DispatchFn
    onDestroyed: () => void
}

export type Uplink = {
    dispatch: DispatchFn
    publish: MembershipChangeFn
    unpublish: MembershipChangeFn
    destroy: () => void
}

export type CreateLinkFn = (downlink: Downlink) => Uplink

export type Router = {
    createLink: CreateLinkFn
}

export type TransportHost = {
    stop: () => Promise<void>
}

export type InitTransportHostFn<OptionsType> = (
    args: {
        createLink: CreateLinkFn
    } & OptionsType,
) => Promise<TransportHost>

export type TransportClient = {
    stop: () => Promise<void>
    createLink: CreateLinkFn
}

export type InitTransportClientFn<OptionsType> = (
    args: OptionsType,
) => Promise<TransportClient>
