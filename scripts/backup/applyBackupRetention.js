import { info } from '../logger.js'
import getBackupRetainingDates from './getBackupRetainingDates.js'

export default ({
    now,
    storage,
}) => {
    const dates = getBackupRetainingDates(now)
    const timestamps = [...new Set(storage.listPaths().split(/\r?\n/)
        .filter(Boolean).map(value => value.split('/')[0]))].sort()
    for (const timestamp of timestamps) {
        if (!/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/.test(timestamp)) continue
        if (dates.has(timestamp.split('_')[0])) {
            info('Keeping backup: ' + timestamp)
        } else {
            info('Deleting backup: ' + timestamp)
            storage.removeSnapshot(timestamp)
        }
    }
}
