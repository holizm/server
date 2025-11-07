import { error } from '../scripts/logger.js'
import { getContent } from './os.js'
import { runOnTerminal } from './terminal.js'

export default params => {
    const {
        propertyName,
        maxAttempts,
    } = params
    const [lowerPort, upperPort] = getContent('/proc/sys/net/ipv4/ip_local_port_range').trim().split(/\s+/).map(Number)
    let port = null
    for (let i = 0; i < (maxAttempts || 1024); i++) {
        const candidate = Math.floor(Math.random() * (upperPort - lowerPort + 1)) + lowerPort
        let out = ''
        try {
            out = runOnTerminal('ss -H -ltnu').toString()
        } catch {
            continue
        }
        if (
            !out.includes(`:${candidate} `) &&
            !out.includes(`:${candidate}\n`) &&
            !out.includes(`:${candidate},`)
        ) {
            port = candidate
            break
        }
    }
    if (port === null) {
        error(`Unable to find a free port after ${maxAttempts} attempts`)
        throw 'No available port found'
    }
    params[propertyName || 'randomPort'] = port
    return port
}
