// TODO: UUID generator - BUT, this is useful for now
export const uniqueId = () =>
    `${Date.now()}_${Math.floor(Math.random() * 1000)}`
