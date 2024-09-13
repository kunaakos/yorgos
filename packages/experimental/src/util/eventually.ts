/**
 * Quick and dirty solution for calling something in a non-blocking way.
 **/
export const eventually = (cb: () => void) => () => {
    if (setImmediate) {
        setImmediate(cb)
    } else if (requestIdleCallback) {
        requestIdleCallback(cb)
    } else {
        cb()
    }
}
