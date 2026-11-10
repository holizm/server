import assert from 'assert/strict'
import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import test from 'node:test'
import generateWebServerConfig from './generateWebServerConfig.js'

test('internal processes get no tenant-facing proxy and stale generated configuration is removed', t => {
    const processPath = mkdtempSync(path.join(tmpdir(), 'internalProxy'))
    t.after(() => rmSync(processPath, {
        force: true,
        recursive: true,
    }))
    writeFileSync(path.join(processPath, 'settingsOverride.json'), JSON.stringify({ runtime: { internal: true } }))
    const webServerPath = path.join(processPath, 'webServer')
    mkdirSync(webServerPath)
    writeFileSync(path.join(webServerPath, 'previous'), 'previous')
    generateWebServerConfig({
        process: 'requestMonitorApi',
        processPath,
        tenants: [['sample', 'example.com', 'fa', 'fa']],
    })
    assert.equal(existsSync(webServerPath), false)
})
