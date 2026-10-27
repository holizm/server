import assert from 'assert/strict'
import childProcess from 'child_process'
import fs from 'fs'
import { syncBuiltinESMExports } from 'module'
import os from 'os'
import path from 'path'
import test from 'node:test'
import runBackup from './runBackup.js'

test('configuration snapshots need no MongoDB and never complete after a failed cloud upload', async t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'runBackup'))
    const calls = []
    let failUpload = false
    t.mock.method(childProcess, 'execFileSync', (command, args) => {
        assert.equal(command, 'az')
        calls.push(args)
        if (failUpload && args.includes('upload-batch')) throw new Error('Cloud unavailable')
        return ''
    })
    syncBuiltinESMExports()
    try {
        for (const instance of ['successfulControl', 'failedControl']) {
            const directory = path.join(home, instance)
            fs.mkdirSync(path.join(directory, 'common'), { recursive: true })
            fs.writeFileSync(path.join(directory, 'org'), 'organization')
            fs.writeFileSync(path.join(directory, 'tenants'), 'tenant example.com')
            fs.writeFileSync(path.join(directory, 'common/privateSettings.json'), JSON.stringify({
                storageConnectionString: 'privateConnection',
                storageProvider: 'azure',
            }))
            failUpload = instance === 'failedControl'
            const backup = runBackup({
                args: [],
                config: {
                    home,
                    instance,
                    storageProvider: 'azure',
                },
            })
            if (failUpload) await assert.rejects(backup, /Cloud unavailable/)
            else await backup
            assert.equal(fs.existsSync(path.join(directory, 'backupDirectory/completed')), !failUpload)
            assert.equal(fs.existsSync(path.join(directory, 'backupLog')), !failUpload)
            assert.equal(fs.readFileSync(path.join(directory, 'backupDirectory/instance'), 'utf8'), instance)
        }
        assert.equal(calls.filter(args => args.includes('upload-batch')).length, 2)
        assert.equal(calls.filter(args => args.includes('upload')).length, 1)
        assert.ok(calls.some(args => args.includes('--num-results=*')))
    } finally {
        t.mock.restoreAll()
        syncBuiltinESMExports()
        fs.rmSync(home, {
            force: true,
            recursive: true,
        })
    }
})
