import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import prepareBackupDirectory from './prepareBackupDirectory.js'

test('preserves settings and composition metadata while excluding symbolic links', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'backupSettings'))
    try {
        fs.mkdirSync(path.join(directory, 'common'))
        fs.mkdirSync(path.join(directory, 'adminApi'))
        fs.writeFileSync(path.join(directory, 'org'), 'organization')
        fs.writeFileSync(path.join(directory, 'tenants'), 'tenant example.com')
        fs.writeFileSync(path.join(directory, 'common/privateSettings.json'), '{"configured":true}')
        fs.writeFileSync(path.join(directory, 'adminApi/settingsOverride.json'), '{"enabled":false}')
        fs.writeFileSync(path.join(directory, 'adminApi/subdomain'), 'api')
        fs.symlinkSync('/etc/passwd', path.join(directory, 'params'))
        const backup = prepareBackupDirectory(directory)
        assert.equal(fs.readFileSync(path.join(backup, 'adminApi/subdomain'), 'utf8'), 'api')
        assert.equal(fs.existsSync(path.join(backup, 'common/privateSettings.json')), true)
        assert.equal(fs.existsSync(path.join(backup, 'adminApi/settingsOverride.json')), true)
        assert.equal(fs.existsSync(path.join(backup, 'params')), false)
    } finally {
        fs.rmSync(directory, {
            force: true,
            recursive: true,
        })
    }
})
