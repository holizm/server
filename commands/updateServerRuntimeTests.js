import assert from 'assert/strict'
import { spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'

test('runtime updates have a foreground timeout and do not save after a timeout', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'runtimeTimeout'))
    const capture = path.join(directory, 'calls')
    try {
        fs.writeFileSync(path.join(directory, 'timeout'), '#!/bin/sh\nprintf "%s\\n" "$@" >> "$capture"\n[ "$failTimeout" != true ] || exit 124\n', { mode: 0o755 })
        fs.writeFileSync(path.join(directory, 'pm2'), '#!/bin/sh\nprintf "%s\\n" "$@" >> "$capture"\n', { mode: 0o755 })
        const env = {
            ...process.env,
            PATH: directory + path.delimiter + process.env.PATH,
            capture,
        }
        const script = new URL('./updateServerRuntime', import.meta.url)
        assert.equal(spawnSync('bash', [script.pathname], { env }).status, 0)
        assert.deepEqual(fs.readFileSync(capture, 'utf8').trim().split('\n'), ['--foreground', '--kill-after=30s', '15m', 'pm2', 'update', 'save'])
        fs.writeFileSync(capture, '')
        env.failTimeout = 'true'
        assert.equal(spawnSync('bash', [script.pathname], { env }).status, 124)
        assert.equal(fs.readFileSync(capture, 'utf8').split('\n').includes('save'), false)
    } finally {
        fs.rmSync(directory, {
            force: true,
            recursive: true,
        })
    }
})
