import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import { azureStorage } from './azureStorage.js'

test('uses the private storage connection string only in the Azure CLI environment', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'azureStorageTest-'))
    const instancePath = path.join(directory, 'instance')
    const binPath = path.join(directory, 'bin')
    const originalPath = process.env.PATH

    try {
        fs.mkdirSync(path.join(instancePath, 'common'), { recursive: true })
        fs.mkdirSync(binPath)
        fs.writeFileSync(path.join(instancePath, 'common', 'privateSettings.json'), JSON.stringify({
            storage: { connectionString: 'testConnectionString' },
        }))
        fs.writeFileSync(path.join(binPath, 'az'), '#!/bin/sh\nprintf "%s\\n" "$AZURE_STORAGE_CONNECTION_STRING" "$*"\n', { mode: 0o755 })
        process.env.PATH = binPath + path.delimiter + originalPath

        const output = azureStorage(instancePath)(['storage', 'blob', 'list'], true)
        assert.equal(output, 'testConnectionString\nstorage blob list\n')
    }
    finally {
        process.env.PATH = originalPath
        fs.rmSync(directory, { force: true, recursive: true })
    }
})
