import {
    execFileSync,
    spawn,
} from 'child_process'
import fs from 'fs'
import path from 'path'
import { info } from '../logger.js'

export default async ({
    backupDirectory,
    config,
    instancePath,
}) => {
    if (!fs.existsSync(path.join(instancePath, 'accounts'))) return
    const container = config.instance + 'AccountsDatabase'
    const destination = path.join(backupDirectory, 'accounts', 'databases', 'accounts.archive')
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    const descriptor = fs.openSync(destination, 'w')
    info('Backing up IAM PostgreSQL database')
    try {
        await new Promise((resolve, reject) => {
            const child = spawn('docker', [
                'exec', container, 'sh', '-c',
                'PGPASSWORD="$POSTGRES_PASSWORD" exec pg_dump --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --format=custom',
            ], { stdio: ['ignore', descriptor, 'inherit'] })
            child.once('error', reject)
            child.once('close', code => code === 0 ? resolve() : reject(new Error('IAM PostgreSQL dump failed')))
        })
    } catch (e) {
        fs.rmSync(destination, { force: true })
        throw e
    } finally {
        fs.closeSync(descriptor)
    }
    const temporaryArchive = '/tmp/iamBackup' + process.pid + '.archive'
    try {
        execFileSync('docker', ['cp', destination, container + ':' + temporaryArchive], { stdio: 'ignore' })
        execFileSync('docker', ['exec', container, 'pg_restore', '--list', temporaryArchive], { stdio: 'ignore' })
    } finally {
        execFileSync('docker', ['exec', container, 'rm', '-f', temporaryArchive], { stdio: 'ignore' })
    }
}
