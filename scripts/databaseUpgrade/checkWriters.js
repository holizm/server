import run from './run.js'

export default (target, options) => {
    const networks = Object.keys(target.inspect.NetworkSettings.Networks)
    for (const network of networks) {
        const containers = JSON.parse(run('docker', ['network', 'inspect', network]))[0].Containers || {}
        const writers = Object.values(containers)
            .map(container => container.Name)
            .filter(name => name !== target.container && /(?:Api|Site|Worker|Etl)$/.test(name))
        if (writers.length) throw new Error(`Stop dependent containers first: ${writers.join(', ')}`)
    }
    if (options.local) return
    const names = JSON.parse(run('pm2', ['jlist']))
        .filter(item => item.pm2_env?.status === 'online')
        .map(item => item.name)
    if (names.length) throw new Error('Stop all PM2 consumers in this account before a server-wide database upgrade')
}
