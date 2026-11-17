import { pathToFileURL } from 'url'
import getListeningPort from './getListeningPort.js'
import { getContent } from './os.js'

const getRuntimeProcessExpectations = (processes, getPort = getListeningPort) => {
    const expected = processes.filter(process => process.pm2_env?.status === 'online').map(process => {
        const item = {
            name: process.name,
            port: getPort(String(process.pid)),
            requiresPort: /(?:api|panel|site)$/i.test(process.name),
        }
        return item
    })
    return expected
}

export default getRuntimeProcessExpectations

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    console.log(JSON.stringify(getRuntimeProcessExpectations(JSON.parse(getContent(process.argv[2])))))
}
