import { cloneMessage } from 'src/util/cloneMessage'

describe('cloneMessage', () => {
    test('should clone plain JS objects', () => {
        const originalObj = {
            number: 1,
            null: null,
            string: 'string',
            array: [[], 1, '2', {}],
            obj: {
                foo: 'foo',
            },
        }
        const originalObjStringified = JSON.stringify(originalObj)
        const clonedObj = cloneMessage(originalObj)
        expect(originalObj).toStrictEqual(clonedObj)
        clonedObj['string'] = 'modified string'
        clonedObj['array'][0] = 'modified array element'
        expect(JSON.stringify(originalObj)).toBe(originalObjStringified)
    })
    test('should not allow functions as properties', () => {
        //@ts-expect-error
        expect(() => cloneMessage({ fn: () => {} })).toThrow()
    })
    test('should not allow `Symbol`s as properties', () => {
        //@ts-expect-error
        expect(() => cloneMessage({ symbol: Symbol() })).toThrow()
    })
    test('should not allow `Map`s as properties', () => {
        //@ts-expect-error
        expect(() => cloneMessage({ map: new Map() })).toThrow()
    })
    test('should not allow `NaN`', () => {
        expect(() =>
            cloneMessage({
                NaN: [...new Array(16).fill(NaN, 0, 16), 'bat', 'maaaan'],
            }),
        ).toThrow()
    })
})
