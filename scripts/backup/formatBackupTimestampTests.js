import assert from 'assert/strict'
import test from 'node:test'
import formatBackupTimestamp from './formatBackupTimestamp.js'

test('produces sortable snapshot timestamps', () => {
    assert.equal(formatBackupTimestamp(new Date(2026, 0, 2, 3, 4, 5)), '2026-01-02_03-04-05')
})
