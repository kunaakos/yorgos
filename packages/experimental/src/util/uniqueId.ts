/**
 * TODO: UUID generator
 * Pretend this is an actual UUID generator until I write one,
 * or, even better, figure out licensing for this project
 * and copy-paste someone else's implementation.
 * You can pass your own or a lib's anyways!
 */
export const uniqueId = () =>
    `${Date.now()}_${Math.floor(Math.random() * 1000)}`
