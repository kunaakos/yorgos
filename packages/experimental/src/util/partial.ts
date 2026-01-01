type FnWithNamedArgs = (...args: any) => any
type AllArgsOf<Fn extends FnWithNamedArgs> = Parameters<Fn>[0]

/**
 * NOTE: extending a `Partial<AllArgsOf<Fn>>` to get `AppliedArgs` instead of `AppliedKeys`
 * would allow unspecified parameters to be applied besides the allowed ones.
 */
export const partial =
    <
        Fn extends FnWithNamedArgs, //
        AppliedKeys extends keyof AllArgsOf<Fn>,
    >(
        fnWithNamedArgs: Fn,
        appliedArgs: { [Arg in AppliedKeys]?: AllArgsOf<Fn>[Arg] },
    ) =>
    (remainingArgs: Omit<AllArgsOf<Fn>, AppliedKeys>): ReturnType<Fn> =>
        fnWithNamedArgs({ ...appliedArgs, ...remainingArgs })
