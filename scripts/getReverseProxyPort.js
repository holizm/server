import { info } from "./logger.js"
import { runOnTerminal } from './terminal.js'

export default params => {
    const { processPath } = params
    let command = `find ${processPath}/webServer -type f -name '*.config' | head -n1`
    info(command)
    const firstConfigFile = runOnTerminal(command, true).trim()
    info(firstConfigFile)
    command = `grep -oP 'proxy_pass\\s+http://localhost:\\K[0-9]+' ${firstConfigFile} | head -n1`
    info(command)
    const reverseProxyPort = runOnTerminal(command, true).trim()
    command = `nginx -T 2>/dev/null | grep -A20 -F "$(grep -m1 server_name ${firstConfigFile} | awk '{print $2}' | tr -d ';')" | grep -oP 'proxy_pass\\s+http://localhost:\\K[0-9]+' | head -n1`
    info(command)
    const runningReverseProxyPort = runOnTerminal(command, true).trim()
    return {
        reverseProxyPort,
        runningReverseProxyPort,
    }
}
