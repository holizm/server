import { readFileSync } from 'node:fs'

const readTimes = statPath => {
    const values = readFileSync(statPath, 'utf8')
        .split('\n')[0]
        .trim()
        .split(/\s+/)
        .slice(1)
        .map(Number)
    const times = {
        idle: values[3] + values[4],
        total: values.reduce((total, value) => total + value, 0),
    }
    return times
}

export const cpu = statPath => {
    let previous = readTimes(statPath)

    const getUsagePercent = () => {
        const current = readTimes(statPath)
        const idleDifference = current.idle - previous.idle
        const totalDifference = current.total - previous.total
        previous = current

        if (totalDifference <= 0) {
            return 0
        }

        return (totalDifference - idleDifference) * 100 / totalDifference
    }

    const result = { getUsagePercent }
    return result
}
