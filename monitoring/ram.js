import { readFileSync } from 'node:fs'

export const ram = memInfoPath => {
    const getUsagePercent = () => {
        const values = Object.fromEntries(readFileSync(memInfoPath, 'utf8')
            .trim()
            .split('\n')
            .map(line => {
                const [name, value] = line.split(':')
                return [name, Number(value.trim().split(/\s+/)[0])]
            }))

        return (values.MemTotal - values.MemAvailable) * 100 / values.MemTotal
    }

    const result = { getUsagePercent }
    return result
}
