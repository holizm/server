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
        "Certificate",
        "Compression",
        "HttpsRedirect",
        "MultitenantWwwRedirect",
        "Listen",
        "Proxy",
        "MultitenantCacheConfig",
        "MultitenantCacheUsage"
    ]
    const {
        file,
        instance,
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
    const nginxFilePath = isAnInclude ? `${processPath}/Nginx/${tenant}/${cleanedFileName}` : `${processPath}/Nginx/${tenant}/${subdomain}${domain}.conf`
    env.NginxFilePath = nginxFilePath
    env.NginxParamsServerName = "$NginxParamsServerName"
    env.NginxParamsRequestUri = "$NginxParamsRequestUri"
    env.NginxParamsHost = "$NginxParamsHost"
    env.NginxParamsScheme = "$NginxParamsScheme"
    env.NginxParamsFor = "$NginxParamsFor"
    env.NginxParamsPort = "$NginxParamsPort"
    env.NginxParamsUpgrade = "$NginxParamsUpgrade"
    env.NginxParamsRequestMethod = "$NginxParamsRequestMethod"
    env.NginxParamsUpstream = "$NginxParamsUpstream"
    const sourceDirectory = "/HolismHolding/Server/Nginx"
    const sourceFile = path.join(sourceDirectory, file)
    const tempFile = `${nginxFilePath}.temp`
    fs.mkdirSync(path.dirname(nginxFilePath), { recursive: true })
    const first = expandEnv(fs.readFileSync(sourceFile, "utf8"))
    fs.writeFileSync(tempFile, first, "utf8")
    env.NginxParamsServerName = "$server_name"
    env.NginxParamsRequestUri = "$request_uri"
    env.NginxParamsHost = "$host"
    env.NginxParamsScheme = "$scheme"
    env.NginxParamsFor = "$proxy_add_x_forwarded_for"
    env.NginxParamsPort = "$proxy_port"
    env.NginxParamsUpgrade = "$http_upgrade"
    env.NginxParamsRequestMethod = "$request_method"
    env.NginxParamsUpstream = "$upstream_cache_status"
    const final = expandEnv(fs.readFileSync(tempFile, "utf8"))
    fs.writeFileSync(nginxFilePath, final, "utf8")
    fs.unlinkSync(tempFile)
}
