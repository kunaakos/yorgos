import { ActorId } from 'src/types/base'
import { CreateLinkFn } from 'src/types/remoting'
import { Actor, DispatchFn } from 'src/types/system'

export type ActorConnection = {
    actor: Actor
    isPublic: boolean
}

export type ConnectActorFn = (args: ActorConnection) => void

export type DisconnectActorFn = (args: {
    id: ActorId //
}) => void

export type ConnectRemotesFn = (createLink: CreateLinkFn) => void

export type DisconnectRemotesFn = () => void

export type Messaging = {
    dispatch: DispatchFn
    connectActor: ConnectActorFn
    disconnectActor: DisconnectActorFn
    connectRemotes: ConnectRemotesFn
    disconnectRemotes: DisconnectRemotesFn
}
