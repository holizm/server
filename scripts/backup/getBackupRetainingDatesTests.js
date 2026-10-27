import assert from 'assert/strict'
import test from 'node:test'
import getBackupRetainingDates from './getBackupRetainingDates.js'

test('retains recent days, weekly snapshots and older monthly snapshots', () => {
    const dates = getBackupRetainingDates(new Date(2026, 9, 27))
    assert.ok(dates.has('2026-10-27'))
    assert.ok(dates.has('2026-09-28'))
    assert.ok(dates.has('2026-09-19'))
    assert.ok(dates.has('2026-01-01'))
    assert.equal(dates.has('2026-09-20'), false)
})
