import { error } from '../scripts/logger.js'

const sendAlerts = async (notifier, alerts) => {
    for (const alert of alerts) {
        try {
            await notifier.send(alert)
        } catch (e) {
            error(e)
        }
    }
}

export const runner = ({
    config,
    notifier,
    resourceMonitor,
}) => {
    const checkResources = async () => {
        try {
            await sendAlerts(notifier, resourceMonitor.checkResources())
        } catch (e) {
            error(e)
        }
    }

    const checkDisk = async () => {
        try {
            await sendAlerts(notifier, resourceMonitor.checkDisk())
        } catch (e) {
            error(e)
        }
    }

    const start = () => {
        setInterval(checkResources, config.resourceCheckIntervalMilliseconds)
        setInterval(checkDisk, config.diskCheckIntervalMilliseconds)
        checkDisk()
    }

    const result = { start }
    return result
}
