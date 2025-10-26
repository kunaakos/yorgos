import { ActorId, Nullable, Serializable } from 'src/types/base'

export type SnapshotOptions<StateType extends Serializable> = {
    every: number
    storage: SnapshotStorage<StateType>
}

export type SnapshotStorage<StateStype extends Serializable> = {
    store: (id: ActorId, state: StateStype) => Promise<void>
    retrieve: (id: ActorId) => Promise<Nullable<StateStype>>
}
