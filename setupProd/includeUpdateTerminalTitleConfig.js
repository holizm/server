#!/usr/bin/env node

import fs from 'fs'
import { getContent } from '../scripts/os.js'

export default () => {
    const bashrcPath = '/etc/bash.bashrc'
    const configPath = '/holism/server/localTerminalUpdateConfig'
    const content = getContent(bashrcPath)
    if (!content.includes(configPath)) {
        fs.appendFileSync(bashrcPath, `\n. ${configPath}\n`, 'utf8')
    }
}
