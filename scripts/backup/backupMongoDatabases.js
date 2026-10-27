import { execFileSync } from 'child_process'
import fs from 'fs'
import { availableParallelism } from 'os'
import path from 'path'
import { parallelize } from '../parallelize.js'
import dumpMongoDatabase from './dumpMongoDatabase.js'

export default async ({
    backupDirectory,
    config,
    databaseToBackup,
    instancePath,
}) => {
    if (!fs.existsSync(path.join(instancePath, 'databases'))) {
        if (databaseToBackup) throw new Error('This deployment has no MongoDB process')
        return
    }
    let output
    try {
        output = execFileSync('docker', [
            'exec', config.instance + 'Databases', 'mongosh', '--quiet',
            '--username=' + config.databasesUser,
            '--password=' + config.databasesPassword,
            '--authenticationDatabase=admin',
            '--eval', 'db.adminCommand({ listDatabases: 1 }).databases.map(database => database.name).join("\\n")',
        ], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'inherit'],
        })
    } catch (e) {
        throw new Error('Could not list MongoDB databases for ' + config.instance)
    }
    const list = output.split(/\r?\n/).filter(Boolean)
    const parallelism = availableParallelism()
    if (databaseToBackup && !list.includes(databaseToBackup)) throw new Error('Database not found: ' + databaseToBackup)
    const databases = databaseToBackup ? [databaseToBackup] : list.filter(name => !['admin', 'config', 'local'].includes(name))
    if (!databases.length) return
    const parallelCollections = Math.max(1, Math.floor(parallelism / Math.min(parallelism, databases.length)))
    await parallelize(databases, database => dumpMongoDatabase({
        backupDirectory,
        config,
        database,
        parallelCollections,
    }))
}
