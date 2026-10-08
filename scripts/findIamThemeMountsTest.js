import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import findIamThemeMounts from './findIamThemeMounts.js'
import formatIamThemeMounts from './formatIamThemeMounts.js'

const createTheme = (root, repository, owner) => {
    const repositoryPath = path.join(root, repository)
    fs.mkdirSync(path.join(repositoryPath, '.git'), { recursive: true })
    fs.mkdirSync(path.join(repositoryPath, 'common'), { recursive: true })
    const login = path.join(repositoryPath, owner, 'iamTheme', 'login')
    fs.mkdirSync(login, { recursive: true })
    fs.writeFileSync(path.join(login, 'theme.properties'), 'parent=keycloak\n')
}

test('finds site and numbered themes with stable read-only mounts', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'iamThemeMounts'))
    try {
        createTheme(root, 'taskOs', 'site')
        createTheme(root, 'phoneAi', 'site')
        createTheme(root, 'holismThemes', 'site')
        createTheme(root, 'holismThemes', 'theme01')
        fs.mkdirSync(path.join(root, 'holismThemes', 'theme02', 'iamTheme'), { recursive: true })
        const mounts = findIamThemeMounts(root)
        assert.deepEqual(mounts.map(mount => mount.name), ['holism', 'holismTheme01', 'phoneAi', 'taskOs'])
        const volumes = formatIamThemeMounts(mounts)
        assert.match(volumes, /holismThemes\/theme01\/iamTheme:\/opt\/keycloak\/themes\/holismTheme01:ro/)
        assert.doesNotMatch(volumes, /theme02/)
    }
    finally {
        fs.rmSync(root, { recursive: true, force: true })
    }
})

test('rejects conflicting theme names', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'iamThemeConflict'))
    try {
        createTheme(root, 'holism', 'site')
        createTheme(root, 'holismThemes', 'site')
        assert.throws(() => findIamThemeMounts(root), /Duplicate IAM theme name: holism/)
    }
    finally {
        fs.rmSync(root, { recursive: true, force: true })
    }
})
