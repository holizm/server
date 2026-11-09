import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import { resolveStorageProvider } from './resolveStorageProvider.js'

test('defaults to Azure when no provider is configured', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'storageProviderTest-'))

    try {
        assert.equal(resolveStorageProvider(directory, ''), 'azure')
    }
    finally {
        fs.rmSync(directory, { force: true, recursive: true })
    }
})

test('uses the current private setting before a generated provider', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'storageProviderTest-'))

    try {
        fs.mkdirSync(path.join(directory, 'common'))
        fs.writeFileSync(path.join(directory, 'common', 'privateSettings.json'), JSON.stringify({
            storageProvider: 'aws',
        }))
        assert.equal(resolveStorageProvider(directory, 'azure'), 'aws')
    }
    finally {
        fs.rmSync(directory, { force: true, recursive: true })
    }
})
