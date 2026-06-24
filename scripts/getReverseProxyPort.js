import { info } from "./logger.js"
import { runOnTerminal } from './terminal.js'

const extractProxyPassPort = (dump, filePath) => {
    const targetFileName = filePath.split('/').pop()
    const lines = dump.split('\n')

    let collecting = false
    let buffer = []

    for (const line of lines) {
        const fileMatch = line.match(/^# configuration file (.+?):$/)

        if (fileMatch) {
            const currentFileName = fileMatch[1].split('/').pop()

            if (currentFileName === targetFileName) {
                collecting = true
                buffer = []
            } else {
                collecting = false
            }

            continue
        }

        if (collecting) {
            buffer.push(line)
        }
    }

    const block = buffer.join('\n')
    const match = block.match(/proxy_pass\s+http:\/\/[^:]+:(\d+)/)

    return match ? Number(match[1]) : null
}

export default params => {
    const { processPath } = params
    let command = `find ${processPath}/webServer -type f -name '*.conf' | sort | head -n1`
    info(command)
    const firstConfigFile = runOnTerminal(command, true).trim()
    info(firstConfigFile)
    command = `grep -oP 'proxy_pass\\s+http://localhost:\\K[0-9]+' ${firstConfigFile} | head -n1`
    info(command)
    const reverseProxyPort = runOnTerminal(command, true).trim()
    command = `nginx -T 2>/dev/null`
    info(command)
    const webServerConfig = runOnTerminal(command, true).trim()
    const runningReverseProxyPort = extractProxyPassPort(webServerConfig, firstConfigFile)
    return {
        reverseProxyPort,
        runningReverseProxyPort,
    }
}
