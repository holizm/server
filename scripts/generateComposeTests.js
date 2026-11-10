import assert from 'assert/strict'
import {
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import test from 'node:test'
import generateCompose from './generateCompose.js'

test('server composition mounts declared host logs read-only and keeps the API port on loopback', t => {
    const processPath = mkdtempSync(path.join(tmpdir(), 'serverRuntime'))
    t.after(() => rmSync(processPath, {
        force: true,
        recursive: true,
    }))
    writeFileSync(path.join(processPath, 'settingsOverride.json'), JSON.stringify({
        runtime: {
            internal: true,
            readOnlyDirectories: ['/var/log/nginx'],
        },
    }))
    generateCompose({
        deterministicPort: 42000,
        home: path.resolve(import.meta.dirname, '../..'),
        isDev: true,
        process: 'requestMonitorApi',
        processPath,
    })
    const output = readFileSync(path.join(processPath, 'compose.yaml'), 'utf8')
    assert.match(output, /source: "\/var\/log\/nginx"/)
    assert.match(output, /read_only: true/)
    assert.match(output, /create_host_path: false/)
    assert.match(output, /127\.0\.0\.1:42000:5000/)
})
