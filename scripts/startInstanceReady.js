import { execFileSync } from 'child_process'
import { isFile } from './os.js'
import getListeningPort from './getListeningPort.js'

const run = (command, args, cwd) => execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, PM2_SILENT: 'true' },
    stdio: ['ignore', 'pipe', 'pipe'],
}).trim()

const composeReady = params => {
    const project = `${params.lowercaseInstance}-${params.lowercaseGitHubImageNameOrProcess}`
    const args = ['compose', '-p', project, '-f', params.composeFile]
    const services = run('docker', [...args, 'config', '--services'], params.processPath).split('\n').filter(Boolean)
    const output = run('docker', [...args, 'ps', '--all', '--format', 'json'], params.processPath)
    const containers = output.split('\n').filter(Boolean).map(line => JSON.parse(line))
    return services.length > 0 && services.every(service => containers.some(container =>
        container.Service === service
        && container.State === 'running'
        && (!container.Health || container.Health === 'healthy')
    ))
}

const pm2Ready = (params, kind) => {
    const processes = JSON.parse(run('pm2', ['jlist'], params.processPath))
    const process = processes.find(item => item.name === params.fullProcessName)
    if (process?.pm2_env?.status !== 'online' || !process.pid) return false
    return kind !== 'api' || Boolean(getListeningPort(String(process.pid)))
}

export default (params, kind) => {
    const deadline = Date.now() + 120000
    const packageProcess = isFile(params.packageFile) || isFile(`${params.processPath}/index.html`)
    while (Date.now() < deadline) {
        try {
            if (packageProcess ? pm2Ready(params, kind) : composeReady(params)) return
        }
        catch (e) {
            if (Date.now() >= deadline) throw e
        }
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000)
    }
    throw new Error(`${params.fullProcessName} did not become ready within 120 seconds`)
}
