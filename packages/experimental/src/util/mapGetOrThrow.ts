export const mapGetOrThrow = <T, TK>(
    map: Map<TK, T>,
    key: TK,
    errorMessage: string,
): T => {
    if (!map.has(key)) {
        throw new Error(errorMessage)
    } else {
        return map.get(key) as T
    }
}
