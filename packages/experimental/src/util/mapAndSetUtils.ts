const mapGet = <T, TK>( //
    map: Map<TK, T>,
    key: TK,
    errorMessage: string,
): T => {
    if (map.has(key)) {
        return map.get(key) as T
    } else {
        throw new Error(errorMessage)
    }
}

const mapSetIfNotPresent = <T, TK>( //
    map: Map<TK, T>,
    key: TK,
    value: T,
    errorMessage: string,
) => {
    if (!map.has(key)) {
        map.set(key, value)
    } else {
        throw new Error(errorMessage)
    }
}

const setAddIfNotPresent = <T>( //
    set: Set<T>,
    value: T,
    errorMessage: string,
) => {
    if (!set.has(value)) {
        set.add(value)
    } else {
        throw new Error(errorMessage)
    }
}

export const map = {
    setIfNotPresent: mapSetIfNotPresent,
    get: mapGet,
}

export const set = {
    addIfNotPresent: setAddIfNotPresent,
}
