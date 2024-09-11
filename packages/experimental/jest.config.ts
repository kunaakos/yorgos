export default {
    testEnvironment: 'node',
    transform: {
        '^.+.ts$': ['ts-jest', {}],
    },
    testRegex: '(\\.test\\.ts)$',
    testPathIgnorePatterns: ['/node_modules/', '/build/'],
    collectCoverage: false,
}
