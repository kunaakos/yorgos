import { Nullable, Serializable } from 'src/types/base'
import { Message } from 'src/types/message'
import { DispatchFn } from 'src/types/system'
import { AnyRecord, AsyncOrSync } from 'src/types/util'

export type ActorFn<
    StateType extends Nullable<Serializable>,
    ContextType extends AnyRecord,
    MessageType extends Message = Message,
> = (
    params: {
        state: StateType
        context: ContextType
        msg: MessageType
        dispatch: DispatchFn
    }, //
) => AsyncOrSync<Nullable<StateType>>
