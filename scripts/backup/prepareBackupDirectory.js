import fs from 'fs'
import path from 'path'
import {
    info,
    warning,
} from '../logger.js'
import {
    createDirIfNotExists,
    getDirs,
} from '../os.js'

export default instancePath => {
    const backupDirectory = path.join(instancePath, 'backupDirectory')
    const copyBackupFile = (relativePath, required) => {
        const source = path.join(instancePath, relativePath)
        const destination = path.join(backupDirectory, relativePath)
        let sourceStat

        try {
            sourceStat = fs.lstatSync(source)
        } catch (e) {
            if (required) {
                warning('Skipping unavailable backup file: ' + relativePath)
            }
            return
        }

        if (!sourceStat.isFile() || sourceStat.isSymbolicLink()) {
            if (required) {
                warning('Skipping unavailable backup file: ' + relativePath)
            }
            return
        }

        createDirIfNotExists(path.dirname(destination))
        fs.cpSync(source, destination, { preserveTimestamps: true })
    }

    info('Preparing ' + backupDirectory)
    fs.rmSync(backupDirectory, {
        force: true,
        recursive: true,
    })

    for (const relativePath of [
        'tenants',
        'org',
        'common/privateSettings.json',
        'common/publicSettings.json',
        'common/connectionStrings.json',
    ]) {
        copyBackupFile(relativePath, true)
    }
    copyBackupFile('params', false)
    copyBackupFile('repo', false)

    const processDirectories = getDirs(instancePath).sort()

    for (const processName of processDirectories) {
        for (const name of ['subdomain', 'githubImageName']) {
            copyBackupFile(path.join(processName, name), false)
        }
        const relativePath = path.join(processName, 'settingsOverride.json')
        const settingsOverrideFile = path.join(instancePath, relativePath)
        try {
            const settingsOverrideStat = fs.lstatSync(settingsOverrideFile)
            if (settingsOverrideStat.isFile() && !settingsOverrideStat.isSymbolicLink()) {
                copyBackupFile(relativePath, true)
            }
        } catch (e) { }
    }

    createDirIfNotExists(path.join(backupDirectory, 'databases'))
    return backupDirectory
}
