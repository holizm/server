import { execFileSync } from 'child_process'
import { saveRenamePlan } from './renamePlan.js'

export default plan => {
    if (plan.stage !== 'started') throw new Error('Deployment must be started before finishing')
    const processes = JSON.parse(execFileSync('pm2', ['jlist'], { encoding: 'utf8' }))
    for (const original of plan.processes) {
        const name = plan.newName + original.name.slice(plan.oldName.length)
        const process = processes.find(process => process.name === name)
        if (process?.pm2_env.status !== 'online' || !process.pm2_env.pm_cwd.startsWith(plan.newPath + '/')) {
            throw new Error('Renamed process is not online at its canonical path: ' + name)
        }
    }
    const network = plan.oldName + 'Network'
    let details
    try {
        details = JSON.parse(execFileSync('docker', ['network', 'inspect', network], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))[0]
    }
    catch (e) {
        if (e.status !== 1) throw e
    }
    if (details) {
        if (Object.keys(details.Containers || {}).length) throw new Error('Old network is still in use')
        execFileSync('docker', ['network', 'rm', network], { stdio: 'ignore' })
    }
    execFileSync('pm2', ['save'], { stdio: 'ignore' })
    plan.stage = 'complete'
    saveRenamePlan(plan)
    console.log('Verified and completed ' + plan.newName)
}
