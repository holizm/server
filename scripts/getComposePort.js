import { runOnTerminal } from './terminal.js'

export default params => {
    const { composeFile } = params
    const composePort = runOnTerminal(
        `rg -oP '127\\.0\\.0\\.1:\\K[0-9]+' ${composeFile} | head -n1`,
        true
    ).trim()
    return composePort
}
