import {
    dirname,
    resolve,
} from 'path'
import run from './run.js'

export default options => {
    const ids = run('docker', ['ps', '-aq']).split(/\s+/).filter(Boolean)
    if (!ids.length) throw new Error('No Docker containers found')
    const containers = JSON.parse(run('docker', ['inspect', ...ids]))
    const candidates = containers.filter(container => /^mongo:/.test(container.Config.Image))
    const selected = options.all
        ?
        candidates
        :
        options.containers.map(name => {
            const container = candidates.find(candidate => candidate.Name === `/${name}`)
            if (!container) throw new Error(`Container not found: ${name}`)
            return container
        })
    if (!selected.length) throw new Error('No platform database containers found')
    return selected.map(container => {
        const labels = container.Config.Labels || {}
        const files = labels['com.docker.compose.project.config_files']?.split(',') || []
        const composeFile = files.find(file => /\/compose\.yaml$/.test(file))
        const data = container.Mounts.find(mount => mount.Destination === '/data/db')
        if (!/^\/[a-z][a-zA-Z0-9]*Databases$/.test(container.Name) || !composeFile || !data?.RW) {
            throw new Error(`Unsupported database composition: ${container.Name.slice(1)}`)
        }
        const target = {
            composeFile: resolve(composeFile),
            container: container.Name.slice(1),
            directory: dirname(resolve(composeFile)),
            image: container.Image,
            inspect: container,
            project: labels['com.docker.compose.project'],
            service: labels['com.docker.compose.service'],
        }
        return target
    }).sort((first, second) => first.container.localeCompare(second.container))
}
