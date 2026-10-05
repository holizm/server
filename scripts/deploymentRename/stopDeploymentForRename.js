import { execFileSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'
import readDeploymentDatabaseState from './readDeploymentDatabaseState.js'
import { saveRenamePlan } from './renamePlan.js'

export default async plan => {
    if (plan.stage !== 'prepared') throw new Error('Deployment must be prepared before stopping')
    const names = plan.processes.map(process => process.name)
    if (names.length) execFileSync('pm2', ['stop', ...names], { stdio: 'ignore' })
    if (existsSync(path.join(plan.oldPath, 'databases', 'data'))) {
        plan.databaseState = await readDeploymentDatabaseState(plan.oldPath)
    }
    for (const container of plan.containers) {
        if (container.State.Running) execFileSync('docker', ['stop', '--time', '120', container.Id], { stdio: 'inherit' })
    }
    plan.stage = 'stopped'
    saveRenamePlan(plan)
    console.log('Stopped ' + plan.oldName)
}
