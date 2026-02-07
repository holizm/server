import fs from 'fs'
import { getContent } from '../scripts/os.js'

export default () => {
    const bashrcPath = '/etc/bash.bashrc'
    const configPath = '/holism/server/updateTerminalTitleConfig'
    const content = getContent(bashrcPath)
    if (!content.includes(configPath)) {
        fs.appendFileSync(bashrcPath, `\n. ${configPath}\n`, 'utf8')
    }
}
