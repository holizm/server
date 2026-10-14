import assert from 'assert/strict'
import test from 'node:test'
import parseArguments from './parseArguments.js'

test('default operation reports plans without applying changes', () => {
    const options = parseArguments(['--all'])
    assert.equal(options.apply, false)
    assert.equal(options.enableFeatures, false)
})

test('write operations require explicit stopped writers and verified recovery', () => {
    assert.throws(() => parseArguments(['--all', '--apply']))
    assert.throws(() => parseArguments(['--all', '--apply', '--writersStopped']))
    assert.equal(parseArguments(['--all', '--apply', '--writersStopped', '--backupVerified']).apply, true)
    assert.throws(() => parseArguments(['--all', '--noBackup']))
})

test('ambiguous, unknown and unsafe arguments are rejected', () => {
    for (const args of [
        [],
        ['--all', 'malekiDatabases'],
        ['--unknown'],
        ['../../malekiDatabases'],
        ['malekiDatabases;id'],
        ['malekiDatabases', 'malekiDatabases'],
    ]) assert.throws(() => parseArguments(args))
})
