import { ActorId } from 'src/types/base'
import { CreateLinkFn } from 'src/types/remoting'
import { Actor, DispatchFn } from 'src/types/system'

//TODO: unnecessary new type, it's just an Actor and a flag
export type ActorConnection = {
    id: ActorId //
    deliver: DispatchFn //
    isPublic?: true //
}

export type ConnectActorFn = (args: {
    actor: Actor
    isPublic?: boolean
}) => void

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
