import path from 'path'
import {
    getLines,
    isFile,
} from './os.js'

export default baseDir => {
    const filePath = path.join(baseDir, 'params')
    if (!isFile(filePath)) throw `Params file not found at ${filePath}`

    const out = {}
    for (const raw of getLines(filePath)) {
        const line = raw.trim()
        if (!line || line[0] === '#') continue
        const idx = line.indexOf('=')
        if (idx === -1) continue
        const key = line.slice(0, idx).trim()
        if (!key) continue
        const value = line.slice(idx + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
        out[key] = value
    }
    return out
}
