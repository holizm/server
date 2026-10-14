import {
    existsSync,
    readFileSync,
} from 'fs'
import { join } from 'path'
import settings from './databaseUpgrade/settings.js'

export default processPath => {
    const marker = join(processPath, 'databaseImage')
    if (existsSync(marker)) {
        const image = readFileSync(marker, 'utf8').trim()
        if (!/^mongo:\d+\.\d+\.\d+$/.test(image)) throw new Error('Invalid stored database image')
        return image
    }
    const compose = join(processPath, 'compose.yaml')
    if (existsSync(compose)) {
        const match = readFileSync(compose, 'utf8').match(/^        image: (mongo:[\w.]+)\s*$/m)
        if (!match) throw new Error('Cannot determine existing database image')
        return match[1]
    }
    return settings.targetImage
}
