import { ActorId } from 'src/types/base'
import { Actor, DispatchFn } from 'src/types/system'

export type ActorConnection = {
    id: ActorId //
    deliver: DispatchFn //
    isPublic?: true //
}

export type ConnectActorFn = (args: ActorConnection) => void

export type DisconnectActorFn = (args: {
    id: ActorId //
}) => void

export type ConnectRemoteFn = (args: {
    actor: Actor //
}) => void

export type DisconnectRemoteFn = () => void

export type Messaging = {
    dispatch: DispatchFn
    connectActor: ConnectActorFn
    disconnectActor: DisconnectActorFn
    connectRemote: ConnectRemoteFn
    disconnectRemote: DisconnectRemoteFn
}
