import assert from 'assert/strict'
import {
    mkdtemp,
    rm,
    writeFile,
} from 'fs/promises'
import { createServer } from 'net'
import { join } from 'path'
import test from 'node:test'
import { fileURLToPath } from 'url'
import { runOnTerminalAsync } from './terminal.js'

test('Docker cleanup uses the selected local socket and prunes only stale dangling images and build cache', async t => {
    const directory = await mkdtemp('/tmp/cleanDocker')
    const socket = join(directory, 'docker.sock')
    const server = createServer()
    t.after(async () => {
        await new Promise(resolve => server.close(resolve))
        await rm(directory, { recursive: true })
    })
    await new Promise(resolve => server.listen(socket, resolve))
    await writeFile(join(directory, 'docker'), '#!/bin/sh\nprintf "%s\n" "$*"\n', { mode: 0o755 })

    const output = await runOnTerminalAsync('bash -c \'. "$cleanDockerScript"; cleanDocker "$dockerSocket"\'', {
        env: {
            ...process.env,
            cleanDockerScript: fileURLToPath(new URL('./cleanDocker.sh', import.meta.url)),
            dockerSocket: socket,
            PATH: directory + ':' + process.env.PATH,
        },
        throwOnError: true,
    })
    assert.deepEqual(output.split('\n').slice(1), [
        `--host unix://${socket} image prune --force --filter until=168h`,
        `--host unix://${socket} builder prune --force --filter until=168h`,
    ])
})
