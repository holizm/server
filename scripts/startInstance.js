import { execFileSync } from 'child_process'
import { fileURLToPath } from 'url'
import startInstancePlan from './startInstancePlan.js'
import startInstanceReady from './startInstanceReady.js'
import { info } from './logger.js'

const startCommand = fileURLToPath(new URL('../commands/start', import.meta.url))

export default (params, filter) => {
    const stages = startInstancePlan(params, filter)
    for (const stage of stages) {
        for (const { kind, params: processParams } of stage) {
            info(`Starting ${processParams.process}`)
            execFileSync(process.execPath, [startCommand], {
                cwd: processParams.processPath,
                stdio: 'inherit',
            })
            startInstanceReady(processParams, kind)
            info(`${processParams.process} is ready`)
        }
    }
}
