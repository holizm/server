import { execFileSync } from 'child_process'

export default (command, args, options) => {
    try {
        return (execFileSync(command, args, {
            encoding: 'utf8',
            maxBuffer: 64 * 1024 * 1024,
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 3600000,
            ...options,
        }) || '').trim()
    }
    catch (e) {
        throw new Error(`${command} failed (${e.status ?? e.code}); provider output withheld`)
    }
}
