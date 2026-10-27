import assert from 'assert/strict'
import test from 'node:test'
import formatBackupDate from './formatBackupDate.js'

test('pads date components across a year boundary', () => {
    assert.equal(formatBackupDate(new Date(2026, 0, 2)), '2026-01-02')
})
