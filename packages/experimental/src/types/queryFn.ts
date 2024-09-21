import { ActorId } from 'src/types/base'
import { Message } from 'src/types/message'
import { TypeAndPayloadOf } from 'src/types/util'

export type QueryFnParams<
    QueryMessageType extends Message = Message, //
> = TypeAndPayloadOf<QueryMessageType> & {
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
) => Promise<TypeAndPayloadOf<ResponseMessageType>>
