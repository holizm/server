import assert from 'assert/strict'
import childProcess from 'child_process'
import fs from 'fs'
import { syncBuiltinESMExports } from 'module'
import test from 'node:test'
import createBackupStorage from './createBackupStorage.js'

test('S3 backup credentials stay in the environment and uploads precede completion markers', t => {
    const calls = []
    t.mock.method(fs, 'accessSync', () => undefined)
    t.mock.method(childProcess, 'execFileSync', (command, args, options) => {
        calls.push({
            args,
            options,
        })
        return ''
    })
    syncBuiltinESMExports()
    try {
        const storage = createBackupStorage({
            backupDirectory: '/tmp/backupSource',
            config: {
                awsAccessKey: 'privateAccess',
                awsBucket: 'testBucket',
                awsEndpoint: 'https://storage.example.com',
                awsSecretKey: 'privateSecret',
                storageProvider: 'aws',
            },
            instancePath: '/tmp/backupInstance',
        })
        storage.upload('2026-10-27_03-00-00')
        storage.markCompleted('2026-10-27_03-00-00')
        assert.equal(calls[0].args[0], 'copy')
        assert.equal(calls[1].args[0], 'copyto')
        assert.equal(calls[0].options.env.RCLONE_S3_SECRET_ACCESS_KEY, 'privateSecret')
        assert.equal(calls[0].args.join(' ').includes('privateSecret'), false)
        assert.equal(calls[0].args.join(' ').includes('privateAccess'), false)
    } finally {
        t.mock.restoreAll()
        syncBuiltinESMExports()
    }
})
