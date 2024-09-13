import { Serializable } from '../types/base'

const cloneDeep = <T>(obj: T): T => {
    if (
        typeof obj === 'string' ||
        (typeof obj === 'number' && !isNaN(obj)) ||
        typeof obj === 'boolean' ||
        obj === null
    ) {
        return obj
    } else if (Array.isArray(obj)) {
        return obj.map(cloneDeep) as T
    } else if (
        typeof obj === 'object' &&
        !(obj instanceof Map) &&
        !(obj instanceof Set)
    ) {
        return Object.entries(obj).reduce((acc, [key, val]) => {
            return Object.assign(acc, { [key]: cloneDeep(val) })
        }, {}) as T // NOTE: forced cast
    } else {
        throw new Error('unallowed property type')
    }
}

export const cloneMessage = <T extends Serializable>(o: T): T => cloneDeep(o)
