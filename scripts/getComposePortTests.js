import assert from 'assert/strict'
import {
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import test from 'node:test'
import getComposePort from './getComposePort.js'

test('Reads the configured loopback port from a composed process', t => {
    const directory = mkdtempSync(path.join(tmpdir(), 'composePort'))
    t.after(() => rmSync(directory, {
        force: true,
        recursive: true,
    }))
    const composeFile = path.join(directory, 'compose.yaml')
    writeFileSync(composeFile, 'services:\n    site:\n        ports:\n            - 127.0.0.1:56416:3000\n')
    assert.equal(getComposePort({ composeFile }), '56416')
})
