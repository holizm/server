import assert from 'assert/strict'
import {
    mkdtemp,
    rm,
    writeFile,
} from 'fs/promises'
import { join } from 'path'
import test from 'node:test'
import { fileURLToPath } from 'url'
import { runOnTerminalAsync } from '../scripts/terminal.js'

test('disk scans the root filesystem in read-only mode and sorts largest first', async t => {
    const directory = await mkdtemp('/tmp/diskCommand')
    t.after(() => rm(directory, { recursive: true }))
    await writeFile(join(directory, 'ncdu'), '#!/bin/sh\nprintf "%s\\n" "$@"\n', { mode: 0o755 })
    const output = await runOnTerminalAsync('"$diskCommand"', {
        env: {
            ...process.env,
            diskCommand: fileURLToPath(new URL('./disk', import.meta.url)),
            PATH: directory + ':' + process.env.PATH,
        },
        throwOnError: true,
    })
    assert.deepEqual(output.split('\n'), ['-x', '-r', '--sort=disk-usage-desc', '/'])
})
