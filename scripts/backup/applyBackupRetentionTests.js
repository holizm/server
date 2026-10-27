import assert from 'assert/strict'
import test from 'node:test'
import applyBackupRetention from './applyBackupRetention.js'

test('deletes only expired timestamp paths and ignores unrelated cloud files', () => {
    const removed = []
    applyBackupRetention({
        now: new Date(2026, 9, 27),
        storage: {
            listPaths: () => '2026-10-27_03-00-00/\n2024-01-02_03-00-00/\nunrelated/\n',
            removeSnapshot: timestamp => removed.push(timestamp),
        },
    })
    assert.deepEqual(removed, ['2024-01-02_03-00-00'])
})
