import {
    rmSync,
    writeFileSync,
} from 'fs'
import { join } from 'path'
import run from './run.js'
import waitReady from './waitReady.js'

export default async (target, image, directory) => {
    const name = `${target.container}UpgradeProbe`
    const environment = join(directory, 'probeEnvironment')
    const values = target.inspect.Config.Env.filter(value => /^(MONGO_INITDB_ROOT_USERNAME|MONGO_INITDB_ROOT_PASSWORD|GLIBC_TUNABLES)=/.test(value))
    writeFileSync(environment, values.join('\n') + '\n', { mode: 0o600 })
    let created = false
    try {
        run('docker', [
            'run', '-d', '--name', name, '--network', 'none', '--env-file', environment,
            '--tmpfs', '/data/db', '--tmpfs', '/data/configdb', image,
        ])
        created = true
        const state = await waitReady(name)
        if (`mongo:${state.version}` !== image) throw new Error('Probe image version mismatch')
    }
    finally {
        if (created) run('docker', ['rm', '-f', name])
        rmSync(environment, { force: true })
    }
}
