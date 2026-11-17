import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import getSavedRuntimeProcessExpectations from './getSavedRuntimeProcessExpectations.js'

test('preserved dumps recover declared ports without relying on old process identifiers', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'savedRuntime'))
    try {
        fs.writeFileSync(path.join(directory, 'compose.yaml'), 'ports: [127.0.0.1:45050:45050]')
        assert.deepEqual(getSavedRuntimeProcessExpectations([{
            name: 'siteApi',
            pm_cwd: directory,
            status: 'online',
        }]), [{
            name: 'siteApi',
            port: '45050',
            requiresPort: true,
        }])
    } finally {
        fs.rmSync(directory, {
            force: true,
            recursive: true,
        })
    }
})
