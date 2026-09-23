import path from 'path'
import { errorAndExit } from './logger.js'
import {
    getContent,
    isFile,
} from './os.js'

const readSettings = filePath => {
    if (!isFile(filePath)) return {}
    try {
        return JSON.parse(getContent(filePath))
    } catch (e) {
        errorAndExit(`Invalid settings JSON at ${filePath}`)
    }
}

const capitalize = value => value.charAt(0).toUpperCase() + value.slice(1)

const flattenSettings = (settings, prefix, result) => {
    for (const [key, value] of Object.entries(settings)) {
        const propertyName = prefix ? `${prefix}${capitalize(key)}` : key
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            flattenSettings(value, propertyName, result)
        }
        else {
            result[propertyName] = value
        }
    }
    return result
}

export default baseDir => {
    const privateSettingsPath = path.join(baseDir, 'common', 'privateSettings.json')
    if (!isFile(privateSettingsPath)) {
        errorAndExit(`Private settings not found at ${privateSettingsPath}`)
    }
    const privateSettings = readSettings(privateSettingsPath)
    const settings = flattenSettings(privateSettings, '', {})
    settings.databasesPassword ??= settings.databasePassword
    settings.databasesUser ??= settings.databasesUsername ?? settings.databaseUser ?? settings.databaseUsername
    settings.searchMasterKey ??= settings.searchEngineApiKey
    return settings
}
