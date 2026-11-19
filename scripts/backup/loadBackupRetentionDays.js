import { lstatSync } from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import formatBackupDate from './formatBackupDate.js'

export default async (instancePath, now) => {
    const policyPath = path.join(instancePath, 'backupRetentionDays.js')
    if (!lstatSync(policyPath, { throwIfNoEntry: false })) return

    const { default: getRetentionDays } = await import(pathToFileURL(policyPath).href)
    const dates = await getRetentionDays(now, formatBackupDate)
    if (!(dates instanceof Set) || !dates.size || [...dates].some(date =>
        typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)
        || new Date(date).toJSON()?.slice(0, 10) !== date
    )) {
        throw new Error('backupRetentionDays.js must return a non-empty Set of YYYY-MM-DD dates')
    }
    return dates
}
