import path from "path"
import { info } from "./logger.js"
import {
    getContent,
    isFile,
} from "./os.js"

export default params => {
    const {
        baseDir,
        home,
        process,
    } = params
    const subdomainFile = `${baseDir}/subdomain`
    let subdomain = ""
    if (isFile(subdomainFile)) {
        subdomain = getContent(subdomainFile).trim()
    } else if (process.toLowerCase().includes("site") && !process.includes("Api")) {
        subdomain = process.replace("site", "")
    } else if (process.endsWith("Api")) {
        subdomain = process.replace("Api", "")
        if (subdomain === "site") subdomain = "api"
        else subdomain = `api.${subdomain}`
    } else if (process.includes("Panel")) {
        subdomain = process.replace("Panel", "")
    } else if (process === "accounts") {
        subdomain = "accounts"
    } else if (process === "search") {
        subdomain = "search"
    } else if (process === "push") {
        subdomain = "push"
    } else if (process === "crawl") {
        subdomain = "crawl"
    } else if (process === "databases") {
        subdomain = "db"
    } else if (process === "storage") {
        subdomain = "storage"
    } else if (process === "statics") {
        subdomain = "statics"
    }
    subdomain = subdomain === "" ? "" : `${subdomain.toLowerCase()}.`
    info(`Subdomain is ${subdomain}`)
    params.subdomain = subdomain
}
