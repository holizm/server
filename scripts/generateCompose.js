import getRandomPort from './getRandomPort.js'
import { errorAndExit } from './logger.js'
import {
    isFile,
    replaceVariables,
} from './os.js'

const getCacheServerPassword = params => {
    const cacheServerPassword = params.cache?.serverPassword ?? params.cacheServerPassword
    if (!cacheServerPassword) {
        errorAndExit('cache.serverPassword not found in private settings')
    }
    return cacheServerPassword
}

const ensureAccountsCredentials = params => {
    const requiredProperties = [
        'accountsAdminPassword',
        'accountsAdminUser',
        'accountsDatabasePassword',
        'accountsDatabaseUser',
    ]
    const missingProperties = requiredProperties.filter(property => !params[property])
    if (missingProperties.length) {
        errorAndExit('accounts.admin and accounts.database credentials are required in private settings')
    }
}

const getFileAndParams = params => {
    const {
        instance,
        process,
    } = params
    if (process === 'site' || isFile('./site')) {
        params.file = 'site'
    } else if (process === 'accounts') {
        ensureAccountsCredentials(params)
        params.propertyName = `${instance}AccountsDatabaseRandomPort`
        getRandomPort(params)
        params.propertyName = `${instance}AccountsAdminerRandomPort`
        getRandomPort(params)
        params.file = 'accounts'
    } else if (process.endsWith('Panel')) {
        params.file = 'panel'
    } else if (process === 'cache') {
        params.cacheServerPassword = getCacheServerPassword(params)
        params.file = 'cacheServer'
    } else if (process === 'databases') {
        if (!params.databasesUser || !params.databasesPassword) {
            errorAndExit('database.user and database.password are required in private settings')
        }
        params.file = 'databases'
    } else if (process.endsWith('Api')) {
        params.file = 'api'
    } else {
        params.file = process
    }
}

export default params => {
    getFileAndParams(params)
    const {
        file,
        home,
        isDev,
        process,
        processPath,
    } = params
    const processesWithoutCompose = [
        'storage',
        'statics',
    ]
    if (processesWithoutCompose.includes(process)) {
        return
    }
    const sourceFile = `${isDev ? home : '/holism'}/server/composes/${file}`
    const targetFile = `${processPath}/compose.yaml`
    replaceVariables(sourceFile, targetFile, params)
}
