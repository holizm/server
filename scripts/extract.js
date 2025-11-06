#!/usr/bin/env node
import fs from "fs"
import path from "path"
import { error, success } from "../scripts/logger.js"

const readValueIfExists = p => (fs.existsSync(p) && fs.statSync(p).isFile() ? fs.readFileSync(p, "utf8").trim() : null)

export default params => {
    const {
        baseDir,
    } = params
    if (baseDir === "/") {
        error("Can not be executed from the root")
        process.exit(1)
    }

    const depth = (baseDir.match(/\//g) || []).length
    if (depth > 4) {
        error(`You are ${depth} levels deep. This command can only be executed for the first and second levels of depth. That is, from ~/instance, or ~/instance/process.`)
        process.exit(1)
    }

    const org = readValueIfExists("./Org") || readValueIfExists("../Org")
    if (!org || !/^[A-Z]/.test(org)) {
        error("Invalid organization. Organization name should start with an uppercase letter.")
        process.exit(1)
    }

    const parts = baseDir.split("/")
    const instance = parts[1] || ""
    if (!instance || !/^[A-Z]/.test(instance)) {
        error("Invalid instance. Instance name should start with an uppercase letter.")
        process.exit(1)
    }

    let repo = instance
    const repoOverride = readValueIfExists("./Repo") || readValueIfExists("../Repo")
    if (repoOverride) repo = repoOverride
    if (!repo || !/^[A-Z]/.test(repo)) {
        error("Invalid repository. Repository name should start with an uppercase letter.")
        process.exit(1)
    }

    const processName = path.posix.basename(baseDir)
    const role = (processName.includes("Panel") || processName.includes("Api")) && !processName.includes("Site") ? processName.replace("Panel", "").replace("Api", "") : null
    const githubImageName = readValueIfExists("./GitHubImageName")
    const githubImageNameOrProcess = githubImageName || processName

    env.organization = org
    env.repository = repo
    env.instance = instance
    env.process = processName
    env.role = role ? role : ""
    env.gitHubImageName = githubImageName || ""
    env.lowercaseGitHubImageName = (githubImageName || "").toLowerCase()
    env.gitHubImageNameOrProcess = githubImageNameOrProcess
    env.lowercaseGitHubImageNameOrProcess = githubImageNameOrProcess.toLowerCase()
    env.lowercaseOrg = org.toLowerCase()
    env.lowercaseRepo = repo.toLowerCase()
    env.lowercaseInstance = instance.toLowerCase()
    env.lowercaseProcess = processName.toLowerCase()
    env.lowercaseRole = role ? role.toLowerCase() : ""
    env.instancePath = `/${instance}`
    env.processPath = `/${instance}/${processName}`
    env.originalProcessPath = `/${repo}/${processName}`
    env.level = depth === 1 ? "Instance" : "Process"

    success(`Organization: ${org}`)
    success(`Repository: ${repo}`)
    success(`Instance: ${instance}`)
    success(`Process: ${processName}`)
    success(`Role: ${role}`)
    success(`ProcessPath=${env.processPath}`)
    success(`OriginalProcessPath=${env.originalProcessPath}`)
}
