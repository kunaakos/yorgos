import { ActorId } from 'src/types/base'
import { PlainMessage } from 'src/types/message'

export const plainTestMessageTo = (to: ActorId): PlainMessage => ({
    type: 'X',
    payload: null,
    meta: { mid: '#', cat: 'P', to },
})
