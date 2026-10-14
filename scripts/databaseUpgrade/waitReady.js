import { setTimeout } from 'timers/promises'
import databaseCommand from './databaseCommand.js'
import run from './run.js'

export default async container => {
    const deadline = Date.now() + 120000
    while (Date.now() < deadline) {
        const state = JSON.parse(run('docker', ['inspect', container]))[0].State
        if (!state.Running) throw new Error(`Database exited before becoming ready: ${container}`)
        try {
            if (run('docker', ['exec', container, 'cat', '/proc/1/comm']) === 'mongod') {
                return databaseCommand(container, 'state')
            }
        }
        catch (e) {
        }
        await setTimeout(1000)
    }
    throw new Error(`Database did not become ready: ${container}`)
}
