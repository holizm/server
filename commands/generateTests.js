import assert from 'assert/strict'
import { spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'

test('backup-only generation does not require runnable process settings or tenants', () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'backupGeneration'))
    const directory = path.join(home, 'legacySite')
    try {
        fs.mkdirSync(path.join(directory, 'common'), { recursive: true })
        fs.writeFileSync(path.join(directory, 'org'), 'organization')
        fs.writeFileSync(path.join(directory, 'common/privateSettings.json'), '{"storageProvider":"azure"}')
        fs.symlinkSync(new URL('../', import.meta.url).pathname, path.join(home, 'server'))
        const generated = spawnSync(process.execPath, [new URL('./generate', import.meta.url).pathname, '--backupOnly'], {
            cwd: directory,
            encoding: 'utf8',
            env: {
                ...process.env,
                HOME: home,
            },
        })
        assert.equal(generated.status, 0, generated.stderr)
        const backup = fs.readFileSync(path.join(directory, 'backup'), 'utf8')
        assert.ok(backup.includes("instance: 'legacySite'"))
        assert.ok(backup.includes('backup/runBackup.js'))
        assert.equal(fs.existsSync(path.join(directory, 'restore')), true)
        assert.equal(fs.existsSync(path.join(directory, 'cache')), false)
    } finally {
        fs.rmSync(home, {
            force: true,
            recursive: true,
        })
    }
})
