import { errorAndExit } from './logger.js'

export default args => {
    const tenantFlagIndex = args.indexOf('--tenants')
    const tenantCsv = tenantFlagIndex < 0 ? '' : args[tenantFlagIndex + 1]
    if (tenantFlagIndex >= 0 && !tenantCsv) {
        errorAndExit('Usage: generate [process] [only] [--tenants tenantOne,tenantTwo]')
    }
    const positional = tenantFlagIndex < 0
        ? args
        : args.filter((arg, index) =>
            index !== tenantFlagIndex && index !== tenantFlagIndex + 1
        )
    if (positional.length > 2 || (positional[1] && positional[1] !== 'only')) {
        errorAndExit('Usage: generate [process] [only] [--tenants tenantOne,tenantTwo]')
    }
    const tenantNames = tenantCsv.split(',').map(name => name.trim()).filter(Boolean)
    if (tenantNames.some(name => !/^[a-z][A-Za-z0-9]*$/.test(name))) {
        errorAndExit('Tenant names must be camelCase identifiers')
    }
    const options = {
        exactMatch: positional[1] === 'only',
        filterValue: positional[0] || '',
        tenantNames: [...new Set(tenantNames)],
    }
    return options
}
