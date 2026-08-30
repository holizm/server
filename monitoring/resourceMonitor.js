export const resourceMonitor = ({
    config,
    cpu,
    disk,
    ram,
    sustainedUsage,
}) => {
    const checkResources = () => {
        const now = performance.now()
        const alerts = [
            sustainedUsage.getAlert({
                now,
                resource: 'CPU',
                thresholdPercent: config.cpuThresholdPercent,
                usagePercent: cpu.getUsagePercent(),
            }),
            sustainedUsage.getAlert({
                now,
                resource: 'RAM',
                thresholdPercent: config.ramThresholdPercent,
                usagePercent: ram.getUsagePercent(),
            }),
        ].filter(Boolean)
        return alerts
    }

    const checkDisk = () => {
        const freeGigabytes = disk.getFreeBytes() / config.gigabyte
        if (freeGigabytes >= config.diskMinimumFreeGigabytes) {
            return []
        }

        return [`Disk free space is ${freeGigabytes.toFixed(2)} GB (minimum ${config.diskMinimumFreeGigabytes} GB).`]
    }

    const result = {
        checkDisk,
        checkResources,
    }
    return result
}
