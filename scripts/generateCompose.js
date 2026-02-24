import {
    isFile,
    replaceVariables,
} from './os.js'
import getRandomPort from './getRandomPort.js'

const getFileAndParams = params => {
    const {
        instance,
        process,
    } = params
    if (process === 'site' || isFile('./site')) {
        if (!params.authSecret) params.authSecret = 'auth_secret'
        if (!params.keycloakIssuer) params.keycloakIssuer = 'https://accounts.example.com/realm/production'
        params.file = 'site'
    } else if (process === 'accounts') {
        params.propertyName = `${instance}AccountsDatabaseRandomPort`
        getRandomPort(params)
        params.propertyName = `${instance}AccountsAdminerRandomPort`
        getRandomPort(params)
        params.file = 'accounts'
    } else if (process.endsWith('Panel')) {
        params.file = 'panel'
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
