import assert from 'assert/strict'
import childProcess from 'child_process'
import { EventEmitter } from 'events'
import fs from 'fs'
import { syncBuiltinESMExports } from 'module'
import os from 'os'
import path from 'path'
import test from 'node:test'
import dumpMongoDatabase from './dumpMongoDatabase.js'

test('removes incomplete MongoDB archives after a failed dump', async t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dumpMongo'))
    fs.mkdirSync(path.join(directory, 'databases'))
    t.mock.method(childProcess, 'spawn', (command, args, options) => {
        fs.writeSync(options.stdio[1], 'partial archive')
        const child = new EventEmitter()
        queueMicrotask(() => child.emit('close', 1))
        return child
    })
    syncBuiltinESMExports()
    try {
        await assert.rejects(dumpMongoDatabase({
            backupDirectory: directory,
            config: { instance: 'site' },
            database: 'contents',
            parallelCollections: os.availableParallelism(),
        }), /MongoDB dump failed/)
        assert.equal(fs.existsSync(path.join(directory, 'databases/contents.archive')), false)
    } finally {
        t.mock.restoreAll()
        syncBuiltinESMExports()
        fs.rmSync(directory, {
            force: true,
            recursive: true,
        })
    }
})
