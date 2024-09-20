import { ActorId } from 'src/types/base'
import { Message } from 'src/types/message'
import { TypeAndpayloadOf } from 'src/types/util'

export type QueryFnParams<
    QueryMessageType extends Message = Message, //
> = TypeAndpayloadOf<QueryMessageType> & {
    id: ActorId
    options?: {
        timeout: number
    }
}

export type QueryFn = <
    QueryMessageType extends Message = Message, //
    ResponseMessageType extends Message = Message, //
>(
    args: QueryFnParams<QueryMessageType>,
) => Promise<TypeAndpayloadOf<ResponseMessageType>>
