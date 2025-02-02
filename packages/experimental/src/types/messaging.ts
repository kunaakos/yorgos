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

export type ConnectRouterFn = (args: {
    actor: Actor //
}) => void

export type DisconnectRouterFn = () => void

export type Messaging = {
    dispatch: DispatchFn
    connectActor: ConnectActorFn
    disconnectActor: DisconnectActorFn
    connectRouter: ConnectRouterFn
    disconnectRouter: DisconnectRouterFn
}
