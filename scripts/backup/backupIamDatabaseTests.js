import assert from 'assert/strict'
import childProcess from 'child_process'
import { EventEmitter } from 'events'
import fs from 'fs'
import { syncBuiltinESMExports } from 'module'
import os from 'os'
import path from 'path'
import test from 'node:test'
import backupIamDatabase from './backupIamDatabase.js'

test('exports and validates the IAM PostgreSQL archive without exposing credentials', async t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'backupIam'))
    fs.mkdirSync(path.join(directory, 'accounts'))
    const calls = []
    t.mock.method(childProcess, 'spawn', (command, args, options) => {
        calls.push(args)
        fs.writeSync(options.stdio[1], 'PGDMP archive')
        const child = new EventEmitter()
        queueMicrotask(() => child.emit('close', 0))
        return child
    })
    t.mock.method(childProcess, 'execFileSync', (command, args) => calls.push(args))
    syncBuiltinESMExports()
    try {
        await backupIamDatabase({
            backupDirectory: path.join(directory, 'backupDirectory'),
            config: { instance: 'site' },
            instancePath: directory,
        })
        const archive = path.join(directory, 'backupDirectory/accounts/databases/accounts.archive')
        assert.equal(fs.readFileSync(archive, 'utf8'), 'PGDMP archive')
        assert.ok(calls[0].includes('siteAccountsDatabase'))
        assert.ok(calls[0].some(value => value.includes('pg_dump') && value.includes('$POSTGRES_DB')))
        assert.ok(calls.some(args => args.includes('pg_restore') && args.includes('--list')))
        assert.ok(calls.at(-1).includes('rm'))
    } finally {
        t.mock.restoreAll()
        syncBuiltinESMExports()
        fs.rmSync(directory, {
            force: true,
            recursive: true,
        })
    }
})

test('an IAM dump failure is fatal and removes the partial archive', async t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'failedIamBackup'))
    fs.mkdirSync(path.join(directory, 'accounts'))
    t.mock.method(childProcess, 'spawn', (command, args, options) => {
        fs.writeSync(options.stdio[1], 'partial')
        const child = new EventEmitter()
        queueMicrotask(() => child.emit('close', 1))
        return child
    })
    syncBuiltinESMExports()
    try {
        await assert.rejects(backupIamDatabase({
            backupDirectory: path.join(directory, 'backupDirectory'),
            config: { instance: 'site' },
            instancePath: directory,
        }), /IAM PostgreSQL dump failed/)
        assert.equal(fs.existsSync(path.join(directory, 'backupDirectory/accounts/databases/accounts.archive')), false)
    } finally {
        t.mock.restoreAll()
        syncBuiltinESMExports()
        fs.rmSync(directory, {
            force: true,
            recursive: true,
        })
    }
})
