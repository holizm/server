import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { info } from '../logger.js'

export default ({
    backupDirectory,
    config,
    database,
    parallelCollections,
}) => new Promise((resolve, reject) => {
    const destination = path.join(backupDirectory, 'databases', database + '.archive')
    const descriptor = fs.openSync(destination, 'w')
    let finished = false
    info('Backing up MongoDB database: ' + database)
    const child = spawn('docker', [
        'exec', config.instance + 'Databases', 'mongodump',
        '--username=' + config.databasesUser,
        '--password=' + config.databasesPassword,
        '--authenticationDatabase=admin',
        '--db=' + database,
        '--numParallelCollections=' + parallelCollections,
        '--archive', '--gzip', '--quiet',
    ], { stdio: ['ignore', descriptor, 'inherit'] })
    const finish = e => {
        if (finished) return
        finished = true
        fs.closeSync(descriptor)
        if (e) {
            fs.rmSync(destination, { force: true })
            reject(e)
        } else resolve()
    }
    child.on('error', finish)
    child.on('close', code => finish(code === 0 ? null : new Error('MongoDB dump failed: ' + database)))
})
