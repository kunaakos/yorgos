import { Nullable, Serializable } from 'src/types/base'
import { Message } from 'src/types/message'
import { DispatchFn } from 'src/types/system'
import { AnyRecord, AsyncOrSync, EmptyRecord } from 'src/types/util'

export type ActorFn<
    AcceptedMessageType extends Message = Message,
    StateType extends Nullable<Serializable> = null,
    ContextType extends AnyRecord = EmptyRecord,
> = (
    params: {
        state: StateType
        context: ContextType
        msg: AcceptedMessageType
        dispatch: DispatchFn
    }, //
) => AsyncOrSync<Nullable<StateType>>
