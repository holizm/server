import assert from 'assert/strict'
import { execFileSync } from 'child_process'
import {
    writeFileSync,
} from 'fs'
import path from 'path'
import readDeploymentDatabaseState from './readDeploymentDatabaseState.js'
import renameProcessConfig from './renameProcessConfig.js'
import { saveRenamePlan } from './renamePlan.js'

export default async plan => {
    if (plan.stage !== 'renamed') throw new Error('Deployment must be renamed before restarting')
    for (const container of plan.containers) {
        const service = container.Config.Labels['com.docker.compose.service']
        const directory = service === 'database'
            ?
            'databases'
            :
            'cache'
        execFileSync('docker', ['compose', '-p', container.Config.Labels['com.docker.compose.project'], '-f', path.join(plan.newPath, directory, 'compose.yaml'), 'up', '-d', '--pull', 'never'], { stdio: 'inherit' })
    }
    if (plan.databaseState) {
        let ready = false
        for (let attempt = 0; attempt < 12 && !ready; attempt++) {
            try {
                assert.deepEqual(await readDeploymentDatabaseState(plan.newPath), plan.databaseState)
                ready = true
            }
            catch (e) {
                if (attempt === 11) throw e
                await new Promise(resolve => setTimeout(resolve, 2000))
            }
        }
        console.log('Database collection and record counts match before rename')
    }
    const names = plan.processes.map(process => process.name)
    if (names.length) execFileSync('pm2', ['delete', ...names], { stdio: 'ignore' })
    const apps = plan.processes.map(process => renameProcessConfig(process, plan))
    const appsFile = plan.planFile.replace(/\.json$/, 'Apps.json')
    writeFileSync(appsFile, JSON.stringify({ apps }, null, 4), { mode: 0o600 })
    if (apps.length) execFileSync('pm2', ['start', appsFile], { stdio: 'ignore' })
    execFileSync('pm2', ['save'], { stdio: 'ignore' })
    plan.stage = 'started'
    saveRenamePlan(plan)
    console.log('Started ' + plan.newName)
}
