import {
    isFile,
    replaceVariables,
} from './os.js'

const getFileAndParams = params => {
    const {
        process,
    } = params
    if (process === 'site' || isFile('./site')) {
        if (!params.authSecret) params.authSecret = 'auth_secret'
        if (!params.keycloakIssuer) params.keycloakIssuer = 'https://accounts.example.com/realm/production'
        params.file = 'site'
    } else if (process === 'accounts') {
        getRandomPort(`${instance}AccountsDatabaseRandomPort`)
        getRandomPort(`${instance}AccountsAdminerRandomPort`)
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
        processPath,
    } = params
    const sourceFile = `${isDev ? home : "/gesht"}/server/composes/${file}`
    const targetFile = `${processPath}/compose.yaml`
    replaceVariables(sourceFile, targetFile, params)
}
