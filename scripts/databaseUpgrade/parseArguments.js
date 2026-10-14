import { userInfo } from 'os'

export default args => {
    const options = {
        all: false,
        apply: false,
        backupVerified: false,
        containers: [],
        enableFeatures: false,
        local: false,
        noBackup: false,
        writersStopped: false,
    }
    const flags = new Map([
        ['--all', 'all'],
        ['--apply', 'apply'],
        ['--backupVerified', 'backupVerified'],
        ['--enableFeatures', 'enableFeatures'],
        ['--local', 'local'],
        ['--noBackup', 'noBackup'],
        ['--writersStopped', 'writersStopped'],
    ])
    for (const arg of args) {
        if (flags.has(arg)) options[flags.get(arg)] = true
        else if (/^[a-z][a-zA-Z0-9]*Databases$/.test(arg)) {
            if (options.containers.includes(arg)) throw new Error('Duplicate database container')
            options.containers.push(arg)
        }
        else throw new Error('Invalid upgrade argument')
    }
    if (options.all === Boolean(options.containers.length)) throw new Error('Select --all or container names')
    if (options.local && userInfo().username !== 'dev') throw new Error('--local requires the dev operating-system user')
    if (options.noBackup && !options.local) {
        throw new Error('--noBackup requires --local and the dev operating-system user')
    }
    if (options.apply && !options.writersStopped) throw new Error('Stop every writer before using --writersStopped')
    if (options.apply && !options.noBackup && !options.backupVerified) {
        throw new Error('Verify a recovery backup before using --backupVerified')
    }
    return options
}
