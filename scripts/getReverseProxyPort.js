import { info } from "./logger.js"
import { runOnTerminal } from './terminal.js'

export const extractProxyPassPort = (dump, domain) => {
    const blocks = dump.split('# configuration file')
    const target = blocks.find(b =>
        b.includes(`server_name ${domain};`)
    )
    if (!target) return null
    const match = target.match(/proxy_pass\s+http:\/\/[^:]+:(\d+)/)
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
