export const generateRandomId = () =>
    `${Date.now()}_${Math.floor(Math.random() * 1000)}`
