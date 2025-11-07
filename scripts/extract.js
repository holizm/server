#!/usr/bin/env node
import path from "path"
import {
    divide,
    errorAndExit,
    success,
} from "../scripts/logger.js"
import { getContent } from "./os.js"

export default params => {
    const {
        depth,
        directoryPath,
        home,
    } = params

    if (directoryPath === "/") {
        errorAndExit("Can not be executed from the root")
    }

    if (depth > 4) {
        errorAndExit(`You are ${depth} levels deep. This command can only be executed for the first and second levels of depth. That is, from ~/instance, or ~/instance/process.`)
    }

    const org = (getContent("./org") || getContent("../org"))?.trim()
    if (!org || !/^[a-z]/.test(org)) {
        errorAndExit("Invalid organization. Organization name should start with an lowercase letter.")
    }

    const parts = directoryPath.split("/")
    const instance = parts[3] || ""
    if (!instance || !/^[a-z]/.test(instance)) {
        errorAndExit("Invalid instance. Instance name should start with an lowercase letter.")
    }

    let repo = instance
    const repoOverride = getContent("./repo") || getContent("../repo")
    if (repoOverride) repo = repoOverride
    if (!repo || !/^[a-z]/.test(repo)) {
        errorAndExit("Invalid repository. Repository name should start with an lowercase letter.")
    }

    const process = depth === 4 ? path.posix.basename(directoryPath) : "NA"
    const role = ((process.endsWith("Panel") || process.endsWith("Api")) && process !== 'site') ? process.replace("Panel", "").replace("Api", "") : null
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
    params.instancePath = `${home}/${instance}`
    params.processPath = `${home}/${instance}/${process}`
    params.originalProcessPath = `${home}/${repo}/${process}`
    params.level = depth === 1 ? "instance" : "process"

    success(`Organization: ${org}`)
    success(`Repository: ${repo}`)
    success(`Instance: ${instance}`)
    success(`Process: ${process}`)
    success(`Role: ${role}`)
    success(`ProcessPath=${params.processPath}`)
    success(`OriginalProcessPath=${params.originalProcessPath}`)
    return params
}
