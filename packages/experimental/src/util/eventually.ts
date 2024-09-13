/**
 * Quick and dirty solution for calling something in a non-blocking way.
 **/
export const eventually = (cb: () => void) => () => {
    if (typeof setImmediate === 'function') {
        setImmediate(cb)
    } else if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(cb)
    } else {
        cb()
    }
}
