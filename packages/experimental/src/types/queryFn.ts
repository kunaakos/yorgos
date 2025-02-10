import { ActorId } from 'src/types/base'
import { Message } from 'src/types/message'
import { TypeAndPayloadOf } from 'src/types/util'

export type QueryOptions = {
    timeout: number
    isPublic: boolean
}

export type QueryFnParams<
    QueryMessageType extends Message = Message, //
> = TypeAndPayloadOf<QueryMessageType> & {
    id: ActorId
    options?: Partial<QueryOptions>
}

export type QueryFn = <
    QueryMessageType extends Message = Message, //
    ResponseMessageType extends Message = Message, //
>(
    args: QueryFnParams<QueryMessageType>,
) => Promise<TypeAndPayloadOf<ResponseMessageType>>
