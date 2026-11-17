import { pathToFileURL } from 'url'
import getListeningPort from './getListeningPort.js'
import { getContent } from './os.js'

const verifyRuntimeProcesses = (expected, current, getPort = getListeningPort) => expected.every(item => {
    return current.some(process => process.name === item.name
        && process.pm2_env?.status === 'online' && process.pid > 0
        && (!item.requiresPort || Boolean(item.port))
        && (!item.port || getPort(String(process.pid)) === item.port))
})

export default verifyRuntimeProcesses

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const expected = JSON.parse(getContent(process.argv[2]))
    const current = JSON.parse(getContent(process.argv[3]))
    if (!verifyRuntimeProcesses(expected, current)) process.exitCode = 1
}
