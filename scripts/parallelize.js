import { availableParallelism } from 'node:os'

export const parallelize = async (items, callback) => {
    const workerCount = Math.min(availableParallelism(), items.length)

    for (let itemIndex = 0; itemIndex < items.length; itemIndex += workerCount) {
        const roundItems = items.slice(itemIndex, itemIndex + workerCount)
        await Promise.all(roundItems.map(callback))
    }
}
