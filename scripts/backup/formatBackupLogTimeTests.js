import assert from 'assert/strict'
import test from 'node:test'
import formatBackupLogTime from './formatBackupLogTime.js'

test('preserves the represented time including the timezone offset', () => {
    const date = new Date(2026, 0, 2, 3, 4, 5)
    assert.equal(new Date(formatBackupLogTime(date)).getTime(), date.getTime())
})
