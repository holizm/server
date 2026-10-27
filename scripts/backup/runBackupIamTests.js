import assert from 'assert/strict'
import childProcess from 'child_process'
import { EventEmitter } from 'events'
import fs from 'fs'
import { syncBuiltinESMExports } from 'module'
import os from 'os'
import path from 'path'
import test from 'node:test'
import runBackup from './runBackup.js'

test('a failed IAM dump prevents cloud upload and the completed marker', async t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'failedIamSnapshot'))
    const directory = path.join(home, 'site')
    fs.mkdirSync(path.join(directory, 'common'), { recursive: true })
    fs.mkdirSync(path.join(directory, 'accounts'))
    fs.writeFileSync(path.join(directory, 'common/privateSettings.json'), JSON.stringify({
        storageConnectionString: 'privateConnection',
        storageProvider: 'azure',
    }))
    const calls = []
    t.mock.method(childProcess, 'execFileSync', (command, args) => calls.push(args))
    t.mock.method(childProcess, 'spawn', () => {
        const child = new EventEmitter()
        queueMicrotask(() => child.emit('close', 1))
        return child
    })
    syncBuiltinESMExports()
    try {
        await assert.rejects(runBackup({
            args: [],
            config: {
                home,
                instance: 'site',
                storageProvider: 'azure',
            },
        }), /IAM PostgreSQL dump failed/)
        assert.equal(calls.length, 0)
        assert.equal(fs.existsSync(path.join(directory, 'backupDirectory/completed')), false)
        assert.equal(fs.existsSync(path.join(directory, 'backupLog')), false)
    } finally {
        t.mock.restoreAll()
        syncBuiltinESMExports()
        fs.rmSync(home, {
            force: true,
            recursive: true,
        })
    }
})
