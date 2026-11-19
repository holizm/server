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
    await writeFile(join(tools, 'id'), '#!/bin/sh\nprintf "4294967294\\n"\n', { mode: 0o755 })
    await writeFile(join(tools, 'npm'), '#!/bin/sh\nprintf "%s\\n" "$@"\n', { mode: 0o755 })
    const addFile = async (relativePath, stale) => {
        const path = join(userHome, relativePath)
        await writeFile(path, 'contents')
        if (stale) {
            const age = new Date(Date.now() - 20 * 86_400_000)
            await utimes(path, age, age)
        }
        return path
    }
    const run = async npmIsRunning => {
        await writeFile(join(tools, 'pgrep'), npmIsRunning ? '#!/bin/sh\nexit 0\n' : '#!/bin/sh\nexit 1\n', { mode: 0o755 })
        return runOnTerminalAsync('bash "$cleanupScript" "$userHome"', {
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

test('user cleanup clears disposable npm cache and old logs while preserving PM2 state and recent logs', async t => {
    const {
        addFile,
        run,
        userHome,
    } = await prepareUserHome(t)
    const oldNpmLog = await addFile('.npm/_logs/old.log', true)
    const oldPmLog = await addFile('.pm2/logs/app-out.log', true)
    const rotatedLog = await addFile('.pm2/logs/app-out.log.1.gz', true)
    const recentLog = await addFile('.pm2/logs/app-error.log', false)
    const processState = await addFile('.pm2/dump.pm2', true)

    const output = await run(false)
    assert.deepEqual(output.split('\n'), ['cache', 'clean', '--force', '--cache', join(userHome, '.npm')])
    await assert.rejects(readFile(oldNpmLog), { code: 'ENOENT' })
    await assert.rejects(readFile(rotatedLog), { code: 'ENOENT' })
    assert.equal(await readFile(oldPmLog, 'utf8'), '')
    assert.equal(await readFile(recentLog, 'utf8'), 'contents')
    assert.equal(await readFile(processState, 'utf8'), 'contents')
})

test('user cleanup skips npm cache when npm is active', async t => {
    const { run } = await prepareUserHome(t)
    assert.equal(await run(true), 'Skipped npm cache while npm is running.')
})
