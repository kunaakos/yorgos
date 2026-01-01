import { ActorFn } from 'src/types/actor'
import { Nullable } from 'src/types/base'
import { Mailbox } from 'src/types/mailbox'
import { StateHandler } from 'src/types/stateHandler.type'
import { DispatchFn } from 'src/types/system'
import { AnyRecord } from 'src/types/util'

export type Supervisor = {
    processMessages: () => void
}

export type MakeSupervisorArgs = {
    fn: ActorFn<any, any>
    dispatch: DispatchFn
    state: Nullable<StateHandler<any>>
    context: AnyRecord
    mailbox: Mailbox
}

export type MakeSupervisor = (args: MakeSupervisorArgs) => Supervisor
