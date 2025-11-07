import fs from 'fs'
import { execSync } from 'child_process'
import { error, warning } from './logger.js'
import extract from './extract.js'
import calculateSubdomain from './calculateSubdomain.js'
import getRandomPort from './getRandomPort.js'
import generateNginxConfig from './generateNginxConfig.js'
import generateCompose from './generateCompose.js'
import { isFile } from './os.js'

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
    params[`${instance}${process}Port`] = params.randomPort
    params.dockerImageName = `ghcr.io/${params.lowercaseOrg}/${params.lowercaseRepo}/${params.lowercaseGitHubImageNameOrProcess}:latest`
    if ((process.includes('Site') && !process.includes('Api')) || isFile('./Site')) {
        if (!params.authSecret) params.authSecret = 'auth_secret'
        if (!params.keycloakIssuer) params.keycloakIssuer = 'https://accounts.example.com/realm/Production'
        generateCompose('MultitenantSite')
    } else if (process === 'Accounts') {
        getRandomPort(`${instance}AccountsDatabaseRandomPort`)
        getRandomPort(`${instance}AccountsAdminerRandomPort`)
        generateCompose('Accounts')
    } else if (process === 'Search') {
        generateCompose('Search')
    } else if (process === 'Crawl') {
        generateCompose('Crawl')
    } else if (process === 'Push') {
        generateCompose('Push')
    } else if (process.includes('Panel')) {
        generateCompose('Panel')
    } else if (process.includes('Api')) {
        generateCompose('Api')
    } else if (process === 'Databases') {
        if (isFile(`/${instance}/Databases/Mongo`)) {
            generateCompose('MongoDatabases')
        } else {
            generateCompose('Databases')
        }
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
            if (process === 'SiteApi') generateNginx = true
            else if (role === 'Admin' || role === 'Site') generateNginx = true
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
        if ((process.includes('Site') && !process.includes('Api')) || isFile('./Site')) {
            generateNginxConfig({
                ...params,
                file: 'MultitenantWwwRedirect'
            })
            generateNginxConfig({
                ...params,
                file: 'Compression'
            })
            if (isFile('./WithCache')) {
                generateNginxConfig({
                    ...params,
                    file: 'MultitenantCacheConfig'
                })
                generateNginxConfig({
                    ...params,
                    file: 'MultitenantCacheUsage'
                })
                generateNginxConfig({
                    ...params,
                    file: 'MultitenantSiteWithCache'
                })
                fs.mkdirSync('Cache', { recursive: true })
                fs.chmodSync('Cache', 0o777)
            } else {
                generateNginxConfig({
                    ...params,
                    file: 'MultitenantSite'
                })
            }
        } else if (process === 'Accounts') {
            generateNginxConfig({
                ...params,
                file: 'MultitenantAccounts'
            })
        } else if (process === 'Search') {
            generateNginxConfig({
                ...params,
                file: 'MultitenantSearch'
            })
        } else if (process === 'Push') {
            generateNginxConfig({
                ...params,
                file: 'MultitenantPush'
            })
        } else if (process === 'Crawl') {
            generateNginxConfig({
                ...params,
                file: 'MultitenantCrawl'
            })
        } else if (process.includes('Panel')) {
            generateNginxConfig({
                ...params,
                file: 'MultitenantApiAndPanel'
            })
        } else if (process.includes('Api')) {
            generateNginxConfig({
                ...params,
                file: 'MultitenantApiAndPanel'
            })
        } else if (process === 'Databases') {
            if (isFile(`/${instance}/Databases/Mongo`)) {
                generateNginxConfig({
                    ...params,
                    file: 'MultitenantMongoDatabases'
                })
            } else {
                generateNginxConfig({
                    ...params,
                    file: 'MultitenantDatabases'
                })
            }
        } else if (process === 'Storage') {
            const result = execSync(
                `cat /${instance}/SiteApi/docker-compose.yml | grep :5000 | cut -d ':' -f2 | cut -d '-' -f2`,
                { encoding: 'utf8', shell: '/bin/bash' }
            ).trim()
            params.randomPort = result
            generateNginxConfig({
                ...params,
                file: 'MultitenantStorage'
            })
        } else {
            warning(`${process} is unknown`)
        }
    }
}
