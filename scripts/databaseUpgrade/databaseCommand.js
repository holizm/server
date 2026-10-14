import { readFileSync } from 'fs'
import run from './run.js'

const program = readFileSync(new URL('./databaseProgram.js', import.meta.url), 'utf8')

export default (container, action, fcv) => {
    const args = ['exec', '-i', '-e', `upgradeAction=${action}`]
    if (fcv) args.push('-e', `upgradeFcv=${fcv}`)
    args.push(container, 'mongosh', '--quiet', '--file', '/dev/stdin')
    const output = JSON.parse(run('docker', args, {
        input: program,
        timeout: action === 'state'
            ?
            10000
            :
            3600000,
    }))
    return output
}
