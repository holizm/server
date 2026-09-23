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
    const privateSettingsPath = path.join(baseDir, 'common', 'privateSettings.json')
    if (!isFile(privateSettingsPath)) {
        errorAndExit(`Private settings not found at ${privateSettingsPath}`)
    }
    return readSettings(privateSettingsPath)
}
