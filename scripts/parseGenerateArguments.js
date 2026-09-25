import { errorAndExit } from './logger.js'

export default args => {
    if (args.length > 1 || args.some(arg => !arg)) {
        errorAndExit('Usage: generate [tenantOne,tenantTwo]')
    }
    const tenantNames = args.length ? args[0].split(',') : []
    if (tenantNames.some(name => !/^[a-z][A-Za-z0-9]*$/.test(name))) {
        errorAndExit('Tenant names must be camelCase identifiers')
    }
    return [...new Set(tenantNames)]
}
