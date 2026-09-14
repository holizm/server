import getRandomPort from './getRandomPort.js'
import { errorAndExit } from './logger.js'
import {
    getContent,
    isFile,
    replaceVariables,
} from './os.js'

const getCacheServerPassword = instancePath => {
    const privateSettingsPath = `${instancePath}/common/privateSettings.json`
    if (!isFile(privateSettingsPath)) {
        errorAndExit(`Private settings not found at ${privateSettingsPath}`)
    }
    const privateSettings = JSON.parse(getContent(privateSettingsPath))
    if (!privateSettings.cache?.serverPassword) {
        errorAndExit(`cache.serverPassword not found in ${privateSettingsPath}`)
    }
    return privateSettings.cache.serverPassword
}

const getFileAndParams = params => {
    const {
        instance,
        instancePath,
        process,
    } = params
    if (process === 'site' || isFile('./site')) {
        if (!params.authSecret) params.authSecret = 'auth_secret'
        if (!params.iamIssuer) params.iamIssuer = 'https://accounts.example.com/realm/production'
        params.file = 'site'
    } else if (process === 'accounts') {
        params.propertyName = `${instance}AccountsDatabaseRandomPort`
        getRandomPort(params)
        params.propertyName = `${instance}AccountsAdminerRandomPort`
        getRandomPort(params)
        params.file = 'accounts'
    } else if (process.endsWith('Panel')) {
        params.file = 'panel'
    } else if (process === 'cache') {
        params.cacheServerPassword = getCacheServerPassword(instancePath)
        params.file = 'cacheServer'
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
