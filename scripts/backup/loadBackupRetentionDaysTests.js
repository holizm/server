import assert from 'assert/strict'
import {
    mkdtempDisposableSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import test from 'node:test'
import loadBackupRetentionDays from './loadBackupRetentionDays.js'

test('loads an instance policy and leaves the default in place when it is absent', async () => {
    using directory = mkdtempDisposableSync(path.join(tmpdir(), 'backupRetention'))
    const now = new Date(2026, 10, 22)
    assert.equal(await loadBackupRetentionDays(directory.path, now), undefined)
    writeFileSync(path.join(directory.path, 'backupRetentionDays.js'),
        "export default now => new Set([now.getFullYear() + '-11-22'])")
    assert.deepEqual(await loadBackupRetentionDays(directory.path, now), new Set(['2026-11-22']))
})

test('rejects invalid custom retention dates', async () => {
    using directory = mkdtempDisposableSync(path.join(tmpdir(), 'backupRetention'))
    writeFileSync(path.join(directory.path, 'backupRetentionDays.js'),
        "export default () => new Set(['2026-02-30'])")
    await assert.rejects(loadBackupRetentionDays(directory.path, new Date()), /must return/)
})
