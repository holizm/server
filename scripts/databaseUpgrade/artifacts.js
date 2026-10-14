import {
    existsSync,
    mkdirSync,
    realpathSync,
    rmdirSync,
    writeFileSync,
} from 'fs'
import { homedir } from 'os'
import {
    dirname,
    join,
} from 'path'

export default () => {
    const lock = '/tmp/holizmDatabaseUpgradeLock'
    mkdirSync(lock, { mode: 0o700 })
    let directory
    try {
        const root = join(homedir(), 'taskArtifacts')
        mkdirSync(root, {
            mode: 0o700,
            recursive: true,
        })
        let ancestor = realpathSync(root)
        while (ancestor !== dirname(ancestor)) {
            if (existsSync(join(ancestor, '.git'))) throw new Error('Upgrade artifacts cannot be inside a repository')
            ancestor = dirname(ancestor)
        }
        directory = join(root, `databaseUpgrade${Date.now()}`)
        mkdirSync(directory, { mode: 0o700 })
    }
    catch (e) {
        rmdirSync(lock)
        throw e
    }
    const artifacts = {
        directory,
        release: () => rmdirSync(lock),
        save: report => writeFileSync(join(directory, 'report.json'), JSON.stringify(report, null, 4) + '\n', { mode: 0o600 }),
    }
    return artifacts
}
