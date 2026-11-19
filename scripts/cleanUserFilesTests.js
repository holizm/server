import assert from 'assert/strict'
import {
    mkdir,
    mkdtemp,
    readFile,
    rm,
    utimes,
    writeFile,
} from 'fs/promises'
import { join } from 'path'
import test from 'node:test'
import { fileURLToPath } from 'url'
import { runOnTerminalAsync } from './terminal.js'

const prepareUserHome = async t => {
    const directory = await mkdtemp('/tmp/cleanUserFiles')
    t.after(() => rm(directory, { recursive: true }))
    const tools = join(directory, 'bin')
    const userHome = join(directory, 'home')
    for (const path of [tools, join(userHome, '.npm/_cacache'), join(userHome, '.npm/_logs'), join(userHome, '.pm2/logs')]) {
        await mkdir(path, { recursive: true })
    }
    await writeFile(join(tools, 'find'), '#!/bin/sh\n[ "$PWD" = "$userHome" ] || exit 2\nexec /usr/bin/find "$@"\n', { mode: 0o755 })
    await writeFile(join(tools, 'id'), '#!/bin/sh\nprintf "4294967294\\n"\n', { mode: 0o755 })
    await writeFile(join(tools, 'npm'), '#!/bin/sh\nprintf "%s\\n" "$@"\n', { mode: 0o755 })
    const addFile = async (relativePath, hoursOld) => {
        const path = join(userHome, relativePath)
        await writeFile(path, 'contents')
        if (hoursOld) {
            const age = new Date(Date.now() - hoursOld * 3_600_000)
            await utimes(path, age, age)
        }
        return path
    }
    const run = async npmIsRunning => {
        await writeFile(join(tools, 'pgrep'), npmIsRunning ? '#!/bin/sh\nexit 0\n' : '#!/bin/sh\nexit 1\n', { mode: 0o755 })
        return runOnTerminalAsync('bash "$cleanupScript" "$userHome"', {
            cwd: directory,
            env: {
                ...process.env,
                cleanupScript: fileURLToPath(new URL('./cleanUserFiles.sh', import.meta.url)),
                PATH: tools + ':' + process.env.PATH,
                userHome,
            },
            throwOnError: true,
        })
    }
    const fixture = {
        addFile,
        run,
        userHome,
    }
    return fixture
}

test('user cleanup flushes PM2 logs while preserving PM2 state and recent npm logs', async t => {
    const {
        addFile,
        run,
        userHome,
    } = await prepareUserHome(t)
    const oldNpmLog = await addFile('.npm/_logs/old.log', 480)
    const recentNpmLog = await addFile('.npm/_logs/recent.log', 25)
    const oldPmLog = await addFile('.pm2/logs/app-out.log', 25)
    const rotatedLog = await addFile('.pm2/logs/app-out.log.1.gz', 1)
    const recentLog = await addFile('.pm2/logs/app-error.log', 23)
    const processState = await addFile('.pm2/dump.pm2', 480)

    const output = await run(false)
    assert.deepEqual(output.split('\n'), [
        'cache',
        'clean',
        '--force',
        '--cache',
        join(userHome, '.npm'),
        'Removed 1 rotated PM2 log files.',
        'Flushed 2 PM2 log files.',
    ])
    await assert.rejects(readFile(oldNpmLog), { code: 'ENOENT' })
    await assert.rejects(readFile(rotatedLog), { code: 'ENOENT' })
    assert.equal(await readFile(oldPmLog, 'utf8'), '')
    assert.equal(await readFile(recentNpmLog, 'utf8'), 'contents')
    assert.equal(await readFile(recentLog, 'utf8'), '')
    assert.equal(await readFile(processState, 'utf8'), 'contents')
})

test('user cleanup skips npm cache when npm is active', async t => {
    const { run } = await prepareUserHome(t)
    assert.deepEqual((await run(true)).split('\n'), [
        'Skipped npm cache while npm is running.',
        'Removed 0 rotated PM2 log files.',
        'Flushed 0 PM2 log files.',
    ])
})
