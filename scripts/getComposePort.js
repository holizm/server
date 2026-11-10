import { runOnTerminal } from './terminal.js'

export default params => {
    const { composeFile } = params
    const composePort = runOnTerminal(
        `rg -o '127[.]0[.]0[.]1:[0-9]+' ${composeFile} | head -n1 | cut -d: -f2`,
        true
    ).trim()
    return composePort
}
