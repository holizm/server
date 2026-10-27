import assert from 'assert/strict'
import childProcess from 'child_process'
import { EventEmitter } from 'events'
import fs from 'fs'
import { syncBuiltinESMExports } from 'module'
import os from 'os'
import path from 'path'
import test from 'node:test'
import backupMongoDatabases from './backupMongoDatabases.js'

test('configuration-only deployments skip MongoDB but reject a requested database', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'backupMongo'))
    const parameters = {
        backupDirectory: directory,
        config: { instance: 'control' },
        databaseToBackup: '',
        instancePath: directory,
    }
    try {
        await backupMongoDatabases(parameters)
        await assert.rejects(backupMongoDatabases({
            ...parameters,
            databaseToBackup: 'accounts',
        }), /no MongoDB process/)
    } finally {
        fs.rmSync(directory, {
            force: true,
            recursive: true,
        })
    }
})

test('backs up application databases and excludes MongoDB system databases', async t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'applicationMongoBackup'))
    fs.mkdirSync(path.join(directory, 'databases'))
    const dumped = []
    t.mock.method(childProcess, 'execFileSync', () => 'admin\nconfig\nlocal\ncontents\naccounts\n')
    t.mock.method(childProcess, 'spawn', (command, args, options) => {
        dumped.push(args.find(value => value.startsWith('--db=')).slice(5))
        fs.writeSync(options.stdio[1], 'complete archive')
        const child = new EventEmitter()
        queueMicrotask(() => child.emit('close', 0))
        return child
    })
    syncBuiltinESMExports()
    try {
        await backupMongoDatabases({
            backupDirectory: directory,
            config: { instance: 'site' },
            databaseToBackup: '',
            instancePath: directory,
        })
        assert.deepEqual(dumped.sort(), ['accounts', 'contents'])
        assert.deepEqual(fs.readdirSync(path.join(directory, 'databases')).sort(), ['accounts.archive', 'contents.archive'])
    } finally {
        t.mock.restoreAll()
        syncBuiltinESMExports()
        fs.rmSync(directory, {
            force: true,
            recursive: true,
        })
    }
})
