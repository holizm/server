import fs from 'fs'
import {
    isFile,
    remove,
    replaceVariables,
} from './os.js'
import { runOnTerminal } from './terminal.js'

const generate = params => {
    const includes = [
        'certificate',
        'compression',
        'cors',
        'httpsRedirect',
        'listen',
        'cacheConfig',
        'cacheUsage',
        'wwwRedirect',
        'proxy',
        'wwwRedirect',
    ]
    const {
        domain,
        file,
        home,
        instance,
        isDev,
        locales,
        process,
        processPath,
        subdomain,
        tenant,
    } = params
    const localesList = locales.split(',').map(s => s.trim()).filter(Boolean)
    params.localesRegex = localesList.join('|')
    const isAnInclude = includes.includes(file)
    const nginxFilePath = isAnInclude
        ?
        `${processPath}/webServer/${tenant}/${file}`
        :
        `${processPath}/webServer/${tenant}/${subdomain}${domain}.conf`
    const sourceFile = `${isDev ? home : '/holism'}/server/webServer/${file}`
    const tempFile = `${nginxFilePath}.temp`
    replaceVariables(sourceFile, tempFile, params)
    replaceVariables(tempFile, nginxFilePath, params)
    remove(tempFile)
}

export default params => {
    const {
        home,
        instance,
        isDev,
        process,
        processPath,
        role,
        tenants,
        user,
    } = params
    remove(`${processPath}/webServer`)
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
        for (const config of [
            'httpsRedirect',
            'certificate',
            'listen',
            'proxy'
        ]) generate({
            ...params,
            file: config,
        })
        if (isFile('./hasBasicAuth')) {
            execSync(
                `htpasswd -b -c ${home}/${instance}/${process}/basicAuth '${params.basicAuthUsername}' '${params.basicAuthPassword}'`,
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
                const cacheDir = `${processPath}/webServer/${tenantName}/cache`
                fs.mkdirSync(cacheDir, {
                    recursive: true,
                    mode: 0o2770,
                })
                runOnTerminal(`
                    chown ${user}:www-data '${cacheDir}'
                    chmod 2770 '${cacheDir}'
                `)
            } else {
                generate({
                    ...params,
                    file: 'site',
                })
            }
        } else if (process.endsWith('Panel')) {
            generate({
                ...params,
                file: 'apiAndPanel',
            })
        } else if (process.endsWith('Api')) {
            generate({
                ...params,
                file: 'apiAndPanel',
            })
        } else if (process === 'storage') {
            const result = runOnTerminal(
                `cat ~/${instance}/siteApi/compose.yaml | grep :5000 | cut -d ':' -f2 | cut -d '-' -f2`,
            ).trim()
            params.randomPort = result
            generate({
                ...params,
                file: 'storage',
            })
        } else if (process === 'statics') {
            generate({
                ...params,
                file: 'compression',
            })
            generate({
                ...params,
                file: 'cors',
            })
            generate({
                ...params,
                file: 'statics',
            })
        } else {
            generate({
                ...params,
                file: process,
            })
        }
    }
}
