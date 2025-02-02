import { ActorId } from 'src/types/base'
import { Actor, DispatchFn } from 'src/types/system'

export type ConnectActorFn = (args: {
    id: ActorId //
    deliver: DispatchFn //
    isPublic?: boolean //
}) => void

export type DisconnectActorFn = (args: {
    id: ActorId //
}) => void

export type ConnectRouterFn = (args: {
    router: Actor //
}) => void

export type DisconnectRouterFn = () => void

export type LocalConnection = {
    deliver: DispatchFn //
    isPublic: boolean //
}

export type RemoteConnection = {
    dispatch: DispatchFn //
}

export type Messaging = {
    dispatch: DispatchFn
    connectActor: ConnectActorFn
    disconnectActor: DisconnectActorFn
    connectRouter: ConnectRouterFn
    disconnectRouter: DisconnectRouterFn
}
