import {
    readFileSync,
    writeFileSync,
} from 'fs'
import path from 'path'

export default plan => {
    const database = plan.containers.find(container => container.Config.Labels['com.docker.compose.service'] === 'database')
    const config = database?.Mounts.find(mount => mount.Destination === '/data/configdb' && mount.Type === 'volume')
    if (!config) return
    const file = path.join(plan.newPath, 'databases', 'compose.yaml')
    let source = readFileSync(file, 'utf8')
    if (source.includes('/data/configdb')) return
    source = source.replace(/(^[ ]+volumes:\n)/m, '$1            - retainedDatabaseConfig:/data/configdb\n')
    source += '\nvolumes:\n    retainedDatabaseConfig:\n        external: true\n        name: ' + config.Name + '\n'
    writeFileSync(file, source)
}
