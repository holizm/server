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

test('clean rejects non-root callers before starting cleanup', async t => {
    const tempDirectory = await mkdtemp('/tmp/cleanCommand')
    t.after(() => rm(tempDirectory, { recursive: true }))
    await writeFile(join(tempDirectory, 'id'), '#!/bin/sh\nprintf "1000\\n"\n', { mode: 0o755 })

    await assert.rejects(runOnTerminalAsync('"$cleanCommand" 2>&1', {
        env: {
            ...process.env,
            cleanCommand: fileURLToPath(new URL('./clean', import.meta.url)),
            PATH: tempDirectory + ':' + process.env.PATH,
        },
        throwOnError: true,
    }), /Run clean as root/)
})
