import {
    chmodSync,
    mkdirSync,
    readFileSync,
    writeFileSync,
} from 'fs'
import path from 'path'

export const loadRenamePlan = file => JSON.parse(readFileSync(file, 'utf8'))

export const saveRenamePlan = plan => {
    mkdirSync(path.dirname(plan.planFile), {
        mode: 0o700,
        recursive: true,
    })
    writeFileSync(plan.planFile, JSON.stringify(plan, null, 4) + '\n', { mode: 0o600 })
    chmodSync(plan.planFile, 0o600)
}
