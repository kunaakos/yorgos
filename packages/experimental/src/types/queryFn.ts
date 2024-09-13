import { ActorId } from './base'
import { Message } from './message'
import { TypeAndpayloadOf } from './util'

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
