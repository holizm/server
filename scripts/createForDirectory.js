import fs from "fs"
import { execSync } from "child_process"
import { error, warning } from "./Logger.js"
import extract from "./Extract.js"
import calculateSubdomain from "./calculateSubdomain.js"
import getRandomPort from "./getRandomPort.js"
import generateNginxConfig from "./GenerateNginxConfig.js"
import generateDockerCompose from "./GenerateDockerCompose.js"

const isFile = p => {
    try {
        return fs.existsSync(p) && fs.statSync(p).isFile()
    } catch {
        return false
    }
}

export default params => {
    const {
        tenant,
        instance,
        process,
        role,
    } = params
    getRandomPort(params)
    extract(params)
    if (process === "common") return
    if (process.includes("backup")) return
    calculateSubdomain(params)
    env[`${instance}${process}Port`] = env.RandomPort
    env.DockerImageName = `ghcr.io/${env.LowercaseOrg}/${env.LowercaseRepo}/${env.LowercaseGitHubImageNameOrProcess}:latest`
    if ((process.includes("Site") && !process.includes("Api")) || isFile("./Site")) {
        if (!env.AuthSecret) env.AuthSecret = "auth_secret"
        if (!env.KeycloakIssuer) env.KeycloakIssuer = "https://accounts.example.com/realm/Production"
        generateDockerCompose("MultitenantSite")
    } else if (process === "Accounts") {
        getRandomPort(`${instance}AccountsDatabaseRandomPort`)
        getRandomPort(`${instance}AccountsAdminerRandomPort`)
        generateDockerCompose("Accounts")
    } else if (process === "Search") {
        generateDockerCompose("Search")
    } else if (process === "Crawl") {
        generateDockerCompose("Crawl")
    } else if (process === "Push") {
        generateDockerCompose("Push")
    } else if (process.includes("Panel")) {
        generateDockerCompose("Panel")
    } else if (process.includes("Api")) {
        generateDockerCompose("Api")
    } else if (process === "Databases") {
        if (isFile(`/${instance}/Databases/Mongo`)) {
            generateDockerCompose("MongoDatabases")
        } else {
            generateDockerCompose("Databases")
        }
    }
    for (const tenant of tenants) {
        let tenantName, domain, locales, defaultLocale, roles
        if (tenant.length === 5) {
            ;[tenantName, domain, locales, defaultLocale, roles] = tenant
            roles = `${roles}`.split(",")
        } else if (tenant.length === 4) {
            ;[tenantName, domain, locales, defaultLocale] = tenant
            roles = []
        } else {
            error(`Incomplete tenant line: ${tenant.join(" ")}`)
            continue
        }
        if (process.endsWith("Panel") || process.endsWith("Api")) {
            let generateNginx = false
            if (process === "SiteApi") generateNginx = true
            else if (role === "Admin" || role === "Site") generateNginx = true
            else if (roles.length && roles.includes(role)) generateNginx = true
            if (!generateNginx) continue
        }
        env.Tenant = tenantName
        env.Domain = domain
        env.Locales = locales
        env.DefaultLocale = defaultLocale
        for (const cfg of ["HttpsRedirect", "Certificate", "Listen", "Proxy"]) generateNginxConfig(cfg)
        if (isFile("./HasBasicAuth")) {
            execSync(
                `htpasswd -b -c /${instance}/${process}/BasicAuth "${env.BasicAuthUsername}" "${env.BasicAuthPassword}"`,
                { stdio: "inherit", shell: "/bin/bash" }
            )
            generateNginxConfig("BasicAuth")
        }
        if ((process.includes("Site") && !process.includes("Api")) || isFile("./Site")) {
            generateNginxConfig("MultitenantWwwRedirect")
            generateNginxConfig("Compression")
            if (isFile("./WithCache")) {
                generateNginxConfig("MultitenantCacheConfig")
                generateNginxConfig("MultitenantCacheUsage")
                generateNginxConfig("MultitenantSiteWithCache")
                fs.mkdirSync("Cache", { recursive: true })
                fs.chmodSync("Cache", 0o777)
            } else {
                generateNginxConfig("MultitenantSite")
            }
        } else if (process === "Accounts") {
            generateNginxConfig("MultitenantAccounts")
        } else if (process === "Search") {
            generateNginxConfig("MultitenantSearch")
        } else if (process === "Push") {
            generateNginxConfig("MultitenantPush")
        } else if (process === "Crawl") {
            generateNginxConfig("MultitenantCrawl")
        } else if (process.includes("Panel")) {
            generateNginxConfig("MultitenantApiAndPanel")
        } else if (process.includes("Api")) {
            generateNginxConfig("MultitenantApiAndPanel")
        } else if (process === "Databases") {
            if (isFile(`/${instance}/Databases/Mongo`)) {
                generateNginxConfig("MultitenantMongoDatabases")
            } else {
                generateNginxConfig("MultitenantDatabases")
            }
        } else if (process === "Storage") {
            const result = execSync(
                `cat /${instance}/SiteApi/docker-compose.yml | grep :5000 | cut -d ':' -f2 | cut -d '-' -f2`,
                { encoding: "utf8", shell: "/bin/bash" }
            ).trim()
            env.RandomPort = result
            generateNginxConfig("MultitenantStorage")
        } else {
            warning(`${process} is unknown`)
        }
    }
}
