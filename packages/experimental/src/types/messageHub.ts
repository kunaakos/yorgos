import { ActorId } from 'src/types/base'
import { DispatchFn } from 'src/types/system'

export type ConnectActorFn = (args: {
    id: ActorId //
    deliver: DispatchFn //
}) => void

export type DisconnectActorFn = (args: {
    id: ActorId //
}) => void

export type LocalConnection = {
    deliver: DispatchFn //
}

export type MessageHub = {
    dispatch: DispatchFn
    connectActor: ConnectActorFn
    disconnectActor: DisconnectActorFn
}
