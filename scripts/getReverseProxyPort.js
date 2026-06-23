import { runOnTerminal } from './terminal.js'

export default params => {
    const { processPath } = params
    const firstConfigFile = runOnTerminal(
        `find ${processPath}/webServer -type f -name '*.config' | head -n1`,
        true
    ).trim()
    const reverseProxyPort = runOnTerminal(
        `grep -oP 'proxy_pass\\s+http://localhost:\\K[0-9]+' ${firstConfigFile} | head -n1`,
        true
    ).trim()
    return reverseProxyPort
}
