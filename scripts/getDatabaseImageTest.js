import assert from 'assert/strict'
import {
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import test from 'node:test'
import getDatabaseImage from './getDatabaseImage.js'

test('generation preserves existing deployments and migrated image markers', () => {
    const directory = mkdtempSync(join(tmpdir(), 'databaseImage'))
    try {
        assert.equal(getDatabaseImage(directory), 'mongo:9.0.2')
        writeFileSync(join(directory, 'compose.yaml'), 'services:\n    database:\n        image: mongo:8.2\n')
        assert.equal(getDatabaseImage(directory), 'mongo:8.2')
        writeFileSync(join(directory, 'databaseImage'), 'mongo:8.3.13\n')
        assert.equal(getDatabaseImage(directory), 'mongo:8.3.13')
        writeFileSync(join(directory, 'databaseImage'), 'mongo:latest\n')
        assert.throws(() => getDatabaseImage(directory))
    }
    finally {
        rmSync(directory, {
            force: true,
            recursive: true,
        })
    }
})
