import path from 'path'
import loadSettings from './loadSettings.js'
import { isFile } from './os.js'

export const resolveStorageProvider = (instancePath, generatedProvider) => {
    const privateSettingsPath = path.join(instancePath, 'common', 'privateSettings.json')
    const settingsProvider = isFile(privateSettingsPath)
        ?
        loadSettings(instancePath).storageProvider
        :
        null
    return settingsProvider || generatedProvider || 'azure'
}
