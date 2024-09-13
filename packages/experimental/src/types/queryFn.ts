import { ActorId, Message } from '../types'
import { TypeAndpayloadOf } from './util'

export type QueryFnArgs<
    QueryMessageType extends Message = Message, //..
> = TypeAndpayloadOf<QueryMessageType> & {
    id: ActorId
    options?: {
        timeout: number
    }
}

export type QueryFn = <
    QueryMessageType extends Message = Message,
    ResponseMessageType extends Message = Message,
>(
    args: QueryFnArgs<QueryMessageType>,
) => Promise<TypeAndpayloadOf<ResponseMessageType>>
