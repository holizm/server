import fs from 'fs'
import path from 'path'
import {
    getContent,
    replaceVariables,
} from './os.js'

const generate = params => {
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

export default params => {
    const {
        home,
        isDev,
        process,
        role,
        tenants,
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
        ]) generate({
            ...params,
            file: cfg,
        })
        if (isFile('./hasBasicAuth')) {
            execSync(
                `htpasswd -b -c /${instance}/${process}/basicAuth '${params.basicAuthUsername}' '${params.basicAuthPassword}'`,
                { stdio: 'inherit', shell: '/bin/bash' }
            )
            generate({
                ...params,
                file: 'basicAuth',
            })
        }
        if (process === 'site' || isFile('./site')) {
            generate({
                ...params,
                file: 'wwwRedirect',
            })
            generate({
                ...params,
                file: 'compression',
            })
            if (isFile('./withCache')) {
                generate({
                    ...params,
                    file: 'cacheConfig',
                })
                generate({
                    ...params,
                    file: 'cacheUsage',
                })
                generate({
                    ...params,
                    file: 'siteWithCache',
                })
                fs.mkdirSync('cache', { recursive: true })
                fs.chmodSync('cache', 0o777)
            } else {
                generate({
                    ...params,
                    file: 'site',
                })
            }
        } else if (process.endsWith('panel')) {
            generate({
                ...params,
                file: 'apiAndPanel',
            })
        } else if (process.endsWith('api')) {
            generate({
                ...params,
                file: 'apiAndPanel',
            })
        } else if (process === 'storage') {
            const result = runOnTerminal(
                `cat /${instance}/siteApi/compose.yaml | grep :5000 | cut -d ':' -f2 | cut -d '-' -f2`,
            ).trim()
            params.randomPort = result
            generate({
                ...params,
                file: 'storage',
            })
        } else {
            generate({
                ...params,
                file: process,
            })
        }
    }
}
