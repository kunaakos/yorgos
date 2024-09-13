import { Message, Nullable } from '../types'
import { DispatchFn } from './system'
import { AsyncOrSync } from './util'

export type ActorFnArgs<
    StateType, //..
    MessageType extends Message, //..
> = {
    state: StateType
    msg: MessageType
    dispatch: DispatchFn
}

export type ActorFnReturnType<StateType> = AsyncOrSync<Nullable<StateType>>

export type ActorFn<
    StateType, //..
    MessageType extends Message = Message, //..
> = (
    args: ActorFnArgs<StateType, MessageType>, //..
) => ActorFnReturnType<StateType>
