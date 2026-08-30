import { statfsSync } from 'node:fs'

export const disk = diskPath => {
    const getFreeBytes = () => {
        const statistics = statfsSync(diskPath)
        return Number(statistics.bavail) * Number(statistics.bsize)
    }

    const result = { getFreeBytes }
    return result
}
