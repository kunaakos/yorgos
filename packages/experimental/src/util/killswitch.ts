/**
 * This utility can be used to mute or rig callbacks passed to other functions.
 */

type KillswitchOptions = {
    silent: boolean
}

export type Killswitch = {
    wrap: KillSwitchWrapper
    engage: () => void
}

type KillSwitchWrapper = <F extends (params: any) => any>(
    fn: F,
) => (params: Parameters<F>[0] | void) => ReturnType<F>

const DEFAULT_OPTIONS = {
    silent: false,
}

export const createKillswitch = (
    passedOptions?: Partial<KillswitchOptions>,
): Killswitch => {
    const { silent } = { ...DEFAULT_OPTIONS, ...passedOptions }
    let killed: Boolean = false

    const wrap: KillSwitchWrapper = (fn) => (params) => {
        if (!killed) {
            return fn(params)
        } else if (!silent) {
            throw new Error('Function with activated killswitch called.')
        }
    }

    return {
        wrap,
        engage: () => {
            killed = true
        },
    }
}
