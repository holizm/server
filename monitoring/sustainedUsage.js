export const sustainedUsage = durationMilliseconds => {
    const highUsageStartedAt = new Map()
    const sentAlerts = new Set()

    const getAlert = ({
        now,
        resource,
        thresholdPercent,
        usagePercent,
    }) => {
        if (usagePercent < thresholdPercent) {
            highUsageStartedAt.delete(resource)
            sentAlerts.delete(resource)
            return null
        }

        if (!highUsageStartedAt.has(resource)) {
            highUsageStartedAt.set(resource, now)
        }

        const startedAt = highUsageStartedAt.get(resource)
        if (now - startedAt < durationMilliseconds || sentAlerts.has(resource)) {
            return null
        }

        sentAlerts.add(resource)
        const durationMinutes = durationMilliseconds / 60_000
        return `${resource} usage is ${usagePercent.toFixed(1)}% (threshold ${thresholdPercent}% for ${durationMinutes} minutes).`
    }

    const result = { getAlert }
    return result
}
