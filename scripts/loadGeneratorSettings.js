import path from 'path'
import { errorAndExit } from './logger.js'
import loadSettings from './loadSettings.js'
import {
    getLines,
    isFile,
} from './os.js'

export default baseDir => {
    const settingsPath = path.join(baseDir, 'common', 'privateSettings.json')
    if (isFile(settingsPath)) return loadSettings(baseDir)
    const paramsPath = path.join(baseDir, 'params')
    if (!isFile(paramsPath)) errorAndExit(`Settings not found at ${settingsPath} or ${paramsPath}`)
    const settings = {}
    for (const raw of getLines(paramsPath)) {
        const line = raw.trim()
        if (!line || line.startsWith('#')) continue
        const separator = line.indexOf('=')
        if (separator < 0) continue
        const key = line.slice(0, separator).trim()
        if (!key) continue
        const value = line.slice(separator + 1).trim()
        settings[key] = value.replace(/^(['"])(.*)\1$/, '$2')
    }
    return settings
}
