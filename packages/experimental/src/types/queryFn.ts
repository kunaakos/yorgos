import { ActorId, UniqueIdFn } from 'src/types/base'
import { Message } from 'src/types/message'
import { TypeAndPayloadOf } from 'src/types/util'

import { Messaging } from './messaging'

export type QueryOptions = {
    timeout: number
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

export type MakeQueryArgs = {
    messaging: Messaging
    uniqueId: UniqueIdFn
}

export type MakeQuery = (args: MakeQueryArgs) => QueryFn
