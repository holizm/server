import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawnSync } from 'child_process'
import test from 'node:test'

const command = new URL('./purgeTenantStorageCache', import.meta.url).pathname

test('purges only the selected tenant cache', () => {
    const instancePath = fs.mkdtempSync(path.join(os.tmpdir(), 'tenantStorageCache'))
    try {
        fs.writeFileSync(path.join(instancePath, 'tenants'), '')
        fs.mkdirSync(path.join(instancePath, 'storage', 'firstTenant'), { recursive: true })
        fs.mkdirSync(path.join(instancePath, 'storage', 'secondTenant'))
        fs.writeFileSync(path.join(instancePath, 'storage', 'firstTenant', 'image.webp'), '')
        const result = spawnSync(process.execPath, [command, 'firstTenant'], {
            cwd: instancePath,
        })
        assert.equal(result.status, 0, result.stderr.toString())
        assert.equal(fs.existsSync(path.join(instancePath, 'storage', 'firstTenant')), false)
        assert.equal(fs.existsSync(path.join(instancePath, 'storage', 'secondTenant')), true)
    }
    finally {
        fs.rmSync(instancePath, { force: true, recursive: true })
    }
})

test('rejects unsafe tenant identifiers', () => {
    const instancePath = fs.mkdtempSync(path.join(os.tmpdir(), 'tenantStorageCache'))
    try {
        fs.writeFileSync(path.join(instancePath, 'tenants'), '')
        const result = spawnSync(process.execPath, [command, '../otherTenant'], {
            cwd: instancePath,
        })
        assert.notEqual(result.status, 0)
    }
    finally {
        fs.rmSync(instancePath, { force: true, recursive: true })
    }
})
