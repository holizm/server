#!/usr/bin/env node
import path from "path"
import {
    errorAndExit,
    success,
} from "../scripts/logger.js"
import { getContent } from "./os.js"

export default params => {
    const {
        baseDir,
    } = params
    if (baseDir === "/") {
        errorAndExit("Can not be executed from the root")
    }

    const depth = (baseDir.match(/\//g) || []).length
    if (depth > 4) {
        errorAndExit(`You are ${depth} levels deep. This command can only be executed for the first and second levels of depth. That is, from ~/instance, or ~/instance/process.`)
    }

    const org = getContent("./org") || getContent("../org")
    if (!org || !/^[a-z]/.test(org)) {
        errorAndExit("Invalid organization. Organization name should start with an lowercase letter.")
    }

    const parts = baseDir.split("/")
    const instance = parts[1] || ""
    if (!instance || !/^[a-z]/.test(instance)) {
        errorAndExit("Invalid instance. Instance name should start with an lowercase letter.")
    }

    let repo = instance
    const repoOverride = getContent("./repo") || getContent("../repo")
    if (repoOverride) repo = repoOverride
    if (!repo || !/^[a-z]/.test(repo)) {
        errorAndExit("Invalid repository. Repository name should start with an lowercase letter.")
    }

    const process = path.posix.basename(baseDir)
    const role = (process.includes("Panel") || process.includes("Api")) && !process.includes("Site") ? process.replace("Panel", "").replace("Api", "") : null
    const githubImageName = getContent("./gitHubImageName")
    const githubImageNameOrProcess = githubImageName || process

    params.org = org
    params.repo = repo
    params.instance = instance
    params.process = process
    params.role = role ? role : ""
    params.gitHubImageName = githubImageName || ""
    params.lowercaseGitHubImageName = (githubImageName || "").toLowerCase()
    params.gitHubImageNameOrProcess = githubImageNameOrProcess
    params.lowercaseGitHubImageNameOrProcess = githubImageNameOrProcess.toLowerCase()
    params.lowercaseOrg = org.toLowerCase()
    params.lowercaseRepo = repo.toLowerCase()
    params.lowercaseInstance = instance.toLowerCase()
    params.lowercaseProcess = process.toLowerCase()
    params.lowercaseRole = role ? role.toLowerCase() : ""
    params.instancePath = `/${instance}`
    params.processPath = `/${instance}/${process}`
    params.originalProcessPath = `/${repo}/${process}`
    params.level = depth === 1 ? "Instance" : "Process"

    success(`Organization: ${org}`)
    success(`Repository: ${repo}`)
    success(`Instance: ${instance}`)
    success(`Process: ${process}`)
    success(`Role: ${role}`)
    success(`ProcessPath=${params.processPath}`)
    success(`OriginalProcessPath=${params.originalProcessPath}`)
    return params
}
