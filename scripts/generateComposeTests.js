import assert from 'assert/strict'
import {
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import test from 'node:test'
import generateCompose from './generateCompose.js'
import loadSettings from './loadSettings.js'

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

test('cache memory limits are read from private settings during generation', t => {
    const processPath = mkdtempSync(path.join(tmpdir(), 'configuredCache'))
    t.after(() => rmSync(processPath, {
        force: true,
        recursive: true,
    }))
    mkdirSync(path.join(processPath, 'common'))
    writeFileSync(path.join(processPath, 'common/privateSettings.json'), JSON.stringify({
        cache: {
            containerMemoryLimit: '192m',
            memoryLimit: '64mb',
            serverPassword: 'testPassword',
        },
    }))
    generateCompose({
        ...loadSettings(processPath),
        deterministicPort: 42000,
        home: path.resolve(import.meta.dirname, '../..'),
        instance: 'sample',
        isDev: true,
        process: 'cache',
        processPath,
    })
    const output = readFileSync(path.join(processPath, 'compose.yaml'), 'utf8')
    assert.match(output, /--maxmemory\n\s+- 64mb/)
    assert.match(output, /mem_limit: 192m/)
})

test('cache composition bounds memory, evicts entries and disables persistence', t => {
    const processPath = mkdtempSync(path.join(tmpdir(), 'cacheRuntime'))
    t.after(() => rmSync(processPath, {
        force: true,
        recursive: true,
    }))
    generateCompose({
        cache: { serverPassword: 'testPassword' },
        deterministicPort: 42000,
        home: path.resolve(import.meta.dirname, '../..'),
        instance: 'sample',
        isDev: true,
        process: 'cache',
        processPath,
    })
    const output = readFileSync(path.join(processPath, 'compose.yaml'), 'utf8')
    assert.match(output, /--maxmemory\n\s+- 128mb/)
    assert.match(output, /--maxmemory-policy\n\s+- allkeys-lru/)
    assert.match(output, /--save\n\s+- ''/)
    assert.match(output, /--appendonly\n\s+- 'no'/)
    assert.match(output, /mem_limit: 256m/)
})
