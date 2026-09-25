import { errorAndExit } from './logger.js'
import {
    getLines,
    isFile,
} from './os.js'

export default tenantNames => {
    if (!isFile('tenants')) {
        errorAndExit('Tenants file not found in the current directory')
    }
    const tenants = getLines('tenants').map(line => line.split(/\s+/))
    if (!tenantNames.length) {
        return tenants
    }
    const selectedTenants = tenants.filter(tenant => tenantNames.includes(tenant[0]))
    const missingTenants = tenantNames.filter(name =>
        !selectedTenants.some(tenant => tenant[0] === name)
    )
    if (missingTenants.length) {
        errorAndExit(`Unknown tenants: ${missingTenants.join(', ')}`)
    }
    return selectedTenants
}
