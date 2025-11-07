import fs from 'fs'
import { execSync } from 'child_process'
import { error, warning } from './logger.js'
import extract from './extract.js'
import calculateSubdomain from './calculateSubdomain.js'
import getRandomPort from './getRandomPort.js'
import generateNginxConfig from './generateNginxConfig.js'
import generateCompose from './generateCompose.js'
import { isFile } from './os.js'
import pascalize from './pascalize.js'

export default params => {
    const {
        tenants,
        role,
    } = params
    getRandomPort(params)
    params = extract(params)
    const {
        process,
        instance,
    } = params
    calculateSubdomain(params)
    params[`${instance}${pascalize(process)}Port`] = params.randomPort
    params.dockerImageName = `ghcr.io/${params.lowercaseOrg}/${params.lowercaseRepo}/${params.lowercaseGitHubImageNameOrProcess}:latest`
    if (process === 'site' || isFile('./site')) {
        if (!params.authSecret) params.authSecret = 'auth_secret'
        if (!params.keycloakIssuer) params.keycloakIssuer = 'https://accounts.example.com/realm/production'
        generateCompose({
            ...params,
            file: 'site',
        })
    } else if (process === 'accounts') {
        getRandomPort(`${instance}AccountsDatabaseRandomPort`)
        getRandomPort(`${instance}AccountsAdminerRandomPort`)
        generateCompose({
            ...params,
            file: 'accounts',
        })
    } else if (process === 'search') {
        generateCompose({
            ...params,
            file: 'search',
        })
    } else if (process === 'crawl') {
        generateCompose({
            ...params,
            file: 'crawl',
        })
    } else if (process === 'push') {
        generateCompose({
            ...params,
            file: 'push',
        })
    } else if (process.endsWith('Panel')) {
        generateCompose({
            ...params,
            file: 'panel',
        })
    } else if (process.endsWith('Api')) {
        generateCompose({
            ...params,
            file: 'api',
        })
    } else if (process === 'databases') {
        generateCompose({
            ...params,
            file: 'databases',
        })
    }
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
        ]) generateNginxConfig({
            ...params,
            file: cfg
        })
        if (isFile('./hasBasicAuth')) {
            execSync(
                `htpasswd -b -c /${instance}/${process}/basicAuth '${params.basicAuthUsername}' '${params.basicAuthPassword}'`,
                { stdio: 'inherit', shell: '/bin/bash' }
            )
            generateNginxConfig({
                ...params,
                file: 'basicAuth'
            })
        }
        if (process === 'site' || isFile('./site')) {
            generateNginxConfig({
                ...params,
                file: 'wwwRedirect'
            })
            generateNginxConfig({
                ...params,
                file: 'compression'
            })
            if (isFile('./withCache')) {
                generateNginxConfig({
                    ...params,
                    file: 'cacheConfig'
                })
                generateNginxConfig({
                    ...params,
                    file: 'cacheUsage'
                })
                generateNginxConfig({
                    ...params,
                    file: 'siteWithCache'
                })
                fs.mkdirSync('cache', { recursive: true })
                fs.chmodSync('cache', 0o777)
            } else {
                generateNginxConfig({
                    ...params,
                    file: 'site'
                })
            }
        } else if (process === 'accounts') {
            generateNginxConfig({
                ...params,
                file: 'accounts'
            })
        } else if (process === 'search') {
            generateNginxConfig({
                ...params,
                file: 'search'
            })
        } else if (process === 'push') {
            generateNginxConfig({
                ...params,
                file: 'push'
            })
        } else if (process === 'crawl') {
            generateNginxConfig({
                ...params,
                file: 'crawl'
            })
        } else if (process.endsWith('panel')) {
            generateNginxConfig({
                ...params,
                file: 'apiAndPanel'
            })
        } else if (process.endsWith('api')) {
            generateNginxConfig({
                ...params,
                file: 'apiAndPanel'
            })
        } else if (process === 'databases') {
            generateNginxConfig({
                ...params,
                file: 'databases'
            })
        } else if (process === 'storage') {
            const result = execSync(
                `cat /${instance}/SiteApi/docker-compose.yml | grep :5000 | cut -d ':' -f2 | cut -d '-' -f2`,
                { encoding: 'utf8', shell: '/bin/bash' }
            ).trim()
            params.randomPort = result
            generateNginxConfig({
                ...params,
                file: 'storage'
            })
        } else {
            warning(`${process} is unknown`)
        }
    }
}
