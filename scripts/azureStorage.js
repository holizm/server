import { execFileSync } from 'child_process'
import loadSettings from './loadSettings.js'

export const azureStorage = instancePath => {
    const connectionString = loadSettings(instancePath).storageConnectionString
    if (!connectionString) {
        throw new Error('Azure Storage connection string is missing from common/privateSettings.json')
    }

    const run = (args, captureOutput) => execFileSync('az', args, {
        encoding: 'utf8',
        env: {
            ...process.env,
            AZURE_STORAGE_CONNECTION_STRING: connectionString,
        },
        stdio: captureOutput ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    })
    return run
}
