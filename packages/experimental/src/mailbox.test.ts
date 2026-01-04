import { describe, expect, test } from 'vitest'

import { plainTestMessageTo } from 'src/util/test/messageTemplates'

import { makeMailbox } from 'src/mailbox'

describe('mailbox', () => {
    test('should store a deep clone of received messages', () => {
        const mailbox = makeMailbox()
        const mutableMessage = plainTestMessageTo('NOBODY')

        mailbox.deliver(mutableMessage)
        mutableMessage.meta = {
            mid: 'oops',
            cat: 'P',
            to: 'something happened',
        }

        const storedMessage = mailbox.getOldest()
        expect(storedMessage).toStrictEqual(plainTestMessageTo('NOBODY'))
    })

    test('should retreive a deep clone of stored messages', () => {
        const mailbox = makeMailbox()

        mailbox.deliver(plainTestMessageTo('NOBODY'))

        const mutatedMessage = mailbox.getOldest()
        mutatedMessage.meta = {
            mid: 'oops',
            cat: 'P',
            to: 'something happened',
        }

        const storedMessage = mailbox.getOldest()
        expect(storedMessage).toStrictEqual(plainTestMessageTo('NOBODY'))
    })
})
