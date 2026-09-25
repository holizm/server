import { errorAndExit } from './logger.js'
import generateTenantWebServerConfig from './generateTenantWebServerConfig.js'
import { remove } from './os.js'

export default params => {
    const {
        process,
        processPath,
        tenantOnly,
        tenants,
    } = params
    if (process === 'cache') {
        return
    }
    const webServerPath = `${processPath}/webServer`
    if (!tenantOnly) {
        remove(webServerPath)
    }
    for (const tenant of tenants) {
        if (tenant.length !== 4 && tenant.length !== 5) {
            errorAndExit(`Incomplete tenant line: ${tenant.join(' ')}`)
        }
        generateTenantWebServerConfig(params, tenant)
    }
}
