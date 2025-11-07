import fs from 'fs'
import path from 'path'
import { replaceVariables } from './os.js'

const getFileAndParams = params => {
    const {
        tenants,
        process,
        isDev,
        home,
    } = params
    for (const tenant of tenants) {
        let tenantName, domain, locales, defaultLocale, roles
        if (tenant.length === 5) {
            [tenantName, domain, locales, defaultLocale, roles] = tenant
            roles = `${roles}`.split(',')
        } else if (tenant.length === 4) {
            [tenantName, domain, locales, defaultLocale] = tenant
            roles = []
        } else {
            error(`Incomplete tenant line: ${tenant.join(' ')}`)
            continue
        }
        if (process.endsWith('Panel') || process.endsWith('Api')) {
            let generateNginx = false
            if (process === 'siteApi') generateNginx = true
            else if (role === 'admin' || role === 'site') generateNginx = true
            else if (roles.length && roles.includes(role)) generateNginx = true
            if (!generateNginx) continue
        }
        params.tenant = tenantName
        params.domain = domain
        params.locales = locales
        params.defaultLocale = defaultLocale
        for (const cfg of [
            'httpsRedirect',
            'certificate',
            'listen',
            'proxy'
        ]) params.file = cfg
        if (isFile('./hasBasicAuth')) {
            execSync(
                `htpasswd -b -c /${instance}/${process}/basicAuth '${params.basicAuthUsername}' '${params.basicAuthPassword}'`,
                { stdio: 'inherit', shell: '/bin/bash' }
            )
            params.file = 'basicAuth'
        }
        if (process === 'site' || isFile('./site')) {
            params.file = 'wwwRedirect'
            params.file = 'compression'
            if (isFile('./withCache')) {
                params.file = 'cacheConfig'
                params.file = 'cacheUsage'
                params.file = 'siteWithCache'
                fs.mkdirSync('cache', { recursive: true })
                fs.chmodSync('cache', 0o777)
            } else {
                params.file = 'site'
            }
        } else if (process.endsWith('panel')) {
            params.file = 'apiAndPanel'
        } else if (process.endsWith('api')) {
            params.file = 'apiAndPanel'
        } else if (process === 'storage') {
            const result = runOnTerminal(
                `cat /${instance}/siteApi/compose.yaml | grep :5000 | cut -d ':' -f2 | cut -d '-' -f2`,
            ).trim()
            params.randomPort = result
            params.file = 'storage'
        } else {
            params.file = process
        }
    }
}

export default params => {
    getFileAndParams(params)
    const includes = [
        'certificate',
        'compression',
        'httpsRedirect',
        'multitenantWwwRedirect',
        'listen',
        'proxy',
        'multitenantCacheConfig',
        'multitenantCacheUsage'
    ]
    const {
        file,
        home,
        instance,
        isDev,
        process,
        tenant,
        domain,
        subdomain,
        processPath,
        locales,
    } = params
    const localesList = locales.split(',').map(s => s.trim()).filter(Boolean)
    const localesRegex = localesList.join('|')
    const isAnInclude = includes.includes(file)
    const cleanedFileName = isAnInclude ? file.replace('Multitenant', '') : ''
    const nginxFilePath = isAnInclude ? `${processPath}/nginx/${tenant}/${cleanedFileName}` : `${processPath}/nginx/${tenant}/${subdomain}${domain}.conf`
    const sourceDirectory = `${isDev ? home : '/gesht'}/server/webServer`
    const sourceFile = path.join(sourceDirectory, file)
    const tempFile = `${nginxFilePath}.temp`
    replaceVariables(getContent(sourceFile))
    replaceVariables(getContent(tempFile))
    fs.unlinkSync(tempFile)
}
