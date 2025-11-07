import fs from "fs"
import path from "path"

const expandEnv = s => {
    if (typeof s !== "string") return s
    s = s.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (m, v) => (process.env[v] !== undefined ? String(process.env[v]) : m))
    s = s.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (m, v) => (process.env[v] !== undefined ? String(process.env[v]) : m))
    return s
}

export default params => {
    const includes = [
        "certificate",
        "compression",
        "httpsRedirect",
        "multitenantWwwRedirect",
        "listen",
        "proxy",
        "multitenantCacheConfig",
        "multitenantCacheUsage"
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
    const localesList = locales.split(",").map(s => s.trim()).filter(Boolean)
    const localesRegex = localesList.join("|")
    const isAnInclude = includes.includes(file)
    const cleanedFileName = isAnInclude ? file.replace("Multitenant", "") : ""
    const nginxFilePath = isAnInclude ? `${processPath}/nginx/${tenant}/${cleanedFileName}` : `${processPath}/nginx/${tenant}/${subdomain}${domain}.conf`
    params.nginxFilePath = nginxFilePath
    params.nginxParamsServerName = "$nginxParamsServerName"
    params.nginxParamsRequestUri = "$nginxParamsRequestUri"
    params.nginxParamsHost = "$nginxParamsHost"
    params.nginxParamsScheme = "$nginxParamsScheme"
    params.nginxParamsFor = "$nginxParamsFor"
    params.nginxParamsPort = "$nginxParamsPort"
    params.nginxParamsUpgrade = "$nginxParamsUpgrade"
    params.nginxParamsRequestMethod = "$nginxParamsRequestMethod"
    params.nginxParamsUpstream = "$nginxParamsUpstream"
    const sourceDirectory = `${isDev ? home : "/gesht"}/server/webServer`
    const sourceFile = path.join(sourceDirectory, file)
    const tempFile = `${nginxFilePath}.temp`
    fs.mkdirSync(path.dirname(nginxFilePath), { recursive: true })
    const first = expandEnv(fs.readFileSync(sourceFile, "utf8"))
    fs.writeFileSync(tempFile, first, "utf8")
    params.nginxParamsServerName = "$server_name"
    params.nginxParamsRequestUri = "$request_uri"
    params.nginxParamsHost = "$host"
    params.nginxParamsScheme = "$scheme"
    params.nginxParamsFor = "$proxy_add_x_forwarded_for"
    params.nginxParamsPort = "$proxy_port"
    params.nginxParamsUpgrade = "$http_upgrade"
    params.nginxParamsRequestMethod = "$request_method"
    params.nginxParamsUpstream = "$upstream_cache_status"
    const final = expandEnv(fs.readFileSync(tempFile, "utf8"))
    fs.writeFileSync(nginxFilePath, final, "utf8")
    fs.unlinkSync(tempFile)
}
