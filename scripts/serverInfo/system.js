import { execSync } from 'child_process'
import { check, error } from '../../scripts/logger.js'

function run(cmd) {
    try {
        return execSync(cmd).toString().trim()
    } catch {
        return ''
    }
}

export default function checkSystem() {
    const manufacturer = run('dmidecode -s system-manufacturer') || 'Unknown'
    const product = run('dmidecode -s system-product-name') || 'Unknown'
    const version = run('dmidecode -s system-version') || ''

    const pcName = `${manufacturer} ${product} ${version}`.trim()

    if (pcName !== 'Unknown')
        check(`PC: ${pcName}`)
    else
        error('Could not determine PC model ❌')
}
