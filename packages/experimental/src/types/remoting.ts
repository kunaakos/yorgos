import { ActorId, ActorSystemId } from 'src/types/base'
import { DispatchFn } from 'src/types/system'

export type MembershipChangeFn = (actorId: ActorId) => void // TODO: these should accept arrays

export type SystemLink = {
    systemId: ActorSystemId
    dispatch: DispatchFn
}

export type RemoteLink = {
    dispatch: DispatchFn
    join: MembershipChangeFn
    leave: MembershipChangeFn
    destroy: () => void
}

export type CreateLinkFn = (args: SystemLink) => RemoteLink // TODO: SystemLink-RemoteLink pair is confusing and inaccurate
export type DestroyLinkFn = (id: ActorSystemId) => void

export type Router = {
    createLink: CreateLinkFn
    destroyLink: DestroyLinkFn
}
