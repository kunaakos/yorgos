import { ActorId } from 'src/types/base'
import { LinkFn } from 'src/types/remoting'
import { Actor, DispatchFn } from 'src/types/system'

export type ConnectActorFn = (args: Actor) => void

export type DisconnectActorFn = (args: {
    id: ActorId //
}) => void

export type ConnectRemotesFn = (createLink: LinkFn) => void

export type DisconnectRemotesFn = () => void

export type Messaging = {
    dispatch: DispatchFn
    connectActor: ConnectActorFn
    disconnectActor: DisconnectActorFn
    connectRemotes: ConnectRemotesFn
    disconnectRemotes: DisconnectRemotesFn
}
