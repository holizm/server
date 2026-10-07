import camelize from './camelize.js'
import generateWebServerFile from './generateWebServerFile.js'
import getDeterministicPort from './getDeterministicPort.js'
import isControlProcess from './isControlProcess.js'
import {
    getContent,
    isFile,
    remove,
} from './os.js'
import { runOnTerminal } from './terminal.js'

const setSiteApiPort = params => {
    const {
        home,
        instance,
    } = params
    const process = 'siteApi'
    const githubImageName = getContent(`${home}/${instance}/${process}/githubImageName`).trim()
    const fullProcessName = camelize(`${instance} ${githubImageName || process}`)
    params.siteApiPort = getDeterministicPort({ fullProcessName })
}

const isApiOrPanel = params => isControlProcess(params)
    || params.process.endsWith('Panel')
    || params.process.endsWith('Api')

const shouldGenerate = (params, roles) => {
    if (!isApiOrPanel(params)) {
        return true
    }
    return params.process === 'siteApi'
        || params.role === 'admin'
        || params.role === 'site'
        || roles.includes(params.role)
}

export default (params, tenant) => {
    const [tenantName, domain, locales, defaultLocale, roleCsv] = tenant
    const roles = roleCsv ? roleCsv.split(',') : []
    const {
        home,
        instance,
        process,
    } = params
    if (!shouldGenerate(params, roles)) {
        return
    }
    if (params.tenantOnly) {
        remove(`${params.processPath}/webServer/${tenantName}`)
    }
    const replacements = {
        ...params,
        defaultLocale,
        domain,
        locales,
        tenant: tenantName,
    }
    const files = ['httpsRedirect', 'certificate', 'listen', 'proxy']
    if (isFile('./hasBasicAuth')) {
        runOnTerminal(`htpasswd -b -c ${home}/${instance}/${process}/basicAuth '${params.basicAuthUsername}' '${params.basicAuthPassword}'`)
        files.push('basicAuth')
    }
    if (process === 'site' || isFile('./site')) {
        setSiteApiPort(replacements)
        files.push('wwwRedirect', 'compression', 'siteBlobs', 'site')
    }
    else if (isApiOrPanel(params)) {
        files.push('compression', 'apiAndPanel')
    }
    else if (process === 'storage') {
        const result = runOnTerminal(
            `cat ~/${instance}/siteApi/compose.yaml | grep :5000 | cut -d ':' -f2 | cut -d '-' -f2`
        ).trim()
        replacements.deterministicPort = result
        files.push('storage')
    }
    else if (process === 'statics') {
        files.push('compression', 'cors', 'statics')
    }
    else {
        files.push(process)
    }
    files.forEach(file => generateWebServerFile({
        ...replacements,
        file,
    }))
}
