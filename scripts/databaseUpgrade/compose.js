import {
    readFileSync,
    writeFileSync,
} from 'fs'
import { join } from 'path'
import run from './run.js'

export default (target, image) => {
    const content = readFileSync(target.composeFile, 'utf8')
    const escapedService = target.service.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`(^    ${escapedService}:\\s*\\n)([\\s\\S]*?)(?=^    \\S|^\\S|$(?![\\s\\S]))`, 'm')
    const service = content.match(pattern)
    if (!service || !/^        image: .*$/m.test(service[2])) throw new Error('Unsupported compose formatting')
    const updated = content.replace(pattern, (_, header, body) => header + body.replace(
        /^        image: .*$/m,
        `        image: ${image}`,
    ))
    const project = target.project
    const args = ['compose', '-p', project, '-f', target.composeFile]
    if (!image) {
        const config = JSON.parse(run('docker', [...args, 'config', '--format', 'json']))
        if (config.services[target.service]?.container_name !== target.container) throw new Error('Compose container mismatch')
        const data = config.services[target.service].volumes.find(volume => volume.target === '/data/db')
        const mounted = target.inspect.Mounts.find(mount => mount.Destination === '/data/db')
        if (!data || (data.type === 'bind' && data.source !== mounted.Source)) throw new Error('Compose data mount mismatch')
        if (data.type === 'volume' && config.volumes[data.source]?.name !== mounted.Name) {
            throw new Error('Compose data volume mismatch')
        }
        return args
    }
    writeFileSync(target.composeFile, updated)
    writeFileSync(join(target.directory, 'databaseImage'), image + '\n', { mode: 0o600 })
    run('docker', [...args, 'config', '--quiet'])
    return args
}
