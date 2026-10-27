import assert from 'assert/strict'
import { spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'

test('generated backup entry invokes the shared runner', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'backupEntry'))
    try {
        const source = fs.readFileSync(new URL('./backup', import.meta.url), 'utf8')
        const file = path.join(directory, 'backupEntry.mjs')
        fs.writeFileSync(file, source.replaceAll('${environmentRoot}', '/platform'))
        assert.equal(spawnSync(process.execPath, ['--check', file]).status, 0)
        assert.ok(source.includes('backup/runBackup.js'))
    } finally {
        fs.rmSync(directory, {
            force: true,
            recursive: true,
        })
    }
})
