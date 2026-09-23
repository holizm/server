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

export default baseDir => {
    const commonPath = path.join(baseDir, 'common')
    const privateSettingsPath = path.join(commonPath, 'privateSettings.json')
    if (!isFile(privateSettingsPath)) {
        errorAndExit(`Private settings not found at ${privateSettingsPath}`)
    }
    const publicSettings = readSettings(path.join(commonPath, 'publicSettings.json'))
    const privateSettings = readSettings(privateSettingsPath)
    const settings = {
        ...publicSettings,
        ...privateSettings,
    }
    return settings
}
