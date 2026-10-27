import fs from 'fs'
import path from 'path'
import {
    divide,
    info,
    success,
} from '../logger.js'
import { resolveStorageProvider } from '../resolveStorageProvider.js'
import applyBackupRetention from './applyBackupRetention.js'
import backupIamDatabase from './backupIamDatabase.js'
import backupMongoDatabases from './backupMongoDatabases.js'
import createBackupStorage from './createBackupStorage.js'
import formatBackupLogTime from './formatBackupLogTime.js'
import formatBackupTimestamp from './formatBackupTimestamp.js'
import prepareBackupDirectory from './prepareBackupDirectory.js'

export default async ({
    args,
    config,
}) => {
    if (args.length > 1) throw new Error('Usage: backup [database]')
    const instancePath = path.join(config.home, config.instance)
    const backupDirectory = path.join(instancePath, 'backupDirectory')
    const databaseToBackup = args[0] || ''
    config.storageProvider = resolveStorageProvider(instancePath, config.storageProvider)
    const storage = databaseToBackup ? null : createBackupStorage({
        backupDirectory,
        config,
        instancePath,
    })
    divide()
    prepareBackupDirectory(instancePath)
    fs.writeFileSync(path.join(backupDirectory, 'instance'), config.instance)
    await backupMongoDatabases({
        backupDirectory,
        config,
        databaseToBackup,
        instancePath,
    })
    if (databaseToBackup) {
        success('Local backup completed for MongoDB database: ' + databaseToBackup)
        return
    }
    await backupIamDatabase({
        backupDirectory,
        config,
        instancePath,
    })
    const now = new Date()
    const timestamp = formatBackupTimestamp(now)
    info('Uploading backup/' + timestamp + ' using ' + config.storageProvider)
    storage.upload(timestamp)
    fs.writeFileSync(path.join(backupDirectory, 'completed'), '')
    storage.markCompleted(timestamp)
    applyBackupRetention({
        now,
        storage,
    })
    fs.appendFileSync(path.join(instancePath, 'backupLog'), formatBackupLogTime(new Date()) + '\n')
    success('Backup completed successfully')
    divide()
}
