/**
 * In case naming is misleading, this is similar to a unix `tee`:
 * Calls `effect` with the return value of the `fn` it wraps before returning.
 */
export const withEffect =
    <Fn extends (args: any) => any>(
        effect: (args: ReturnType<Fn>) => void,
        fn: Fn,
    ) =>
    (args: Parameters<Fn>[0]): ReturnType<Fn> => {
        const returnValue = fn(args)
        effect(returnValue)
        return returnValue
    }
