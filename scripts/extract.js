#!/usr/bin/env node
import path from 'path'
import {
    divide,
    errorAndExit,
    success,
} from '../scripts/logger.js'
import {
    getContent,
    getDepth,
    isDev,
} from './os.js'
import pascalize from './pascalize.js'
import camelize from './camelize.js'

export default params => {
    let {
        depth,
        directoryPath,
    } = params
    if (!depth) {
        depth = getDepth(directoryPath)
    }

    if (directoryPath === '/') {
        errorAndExit('Can not be executed from the root')
    }
    const home = process.env.HOME
    if (directoryPath === home) {
        errorAndExit('Can not run command from the home directory')
    }

    if (depth > 4) {
        errorAndExit(`You are ${depth} levels deep. This command can only be executed for the first and second levels of depth. That is, from ~/instance, or ~/instance/process.`)
    }

    const org = (getContent('./org') || getContent('../org'))?.trim()
    if (!org || !/^[a-z]/.test(org)) {
        errorAndExit('Invalid organization. Organization name should start with an lowercase letter.')
    }

    const parts = directoryPath.split('/')
    const instance = parts[3] || ''
    if (!instance || !/^[a-z]/.test(instance)) {
        errorAndExit('Invalid instance. Instance name should start with an lowercase letter.')
    }

    let repo = instance
    const repoOverride = getContent('./repo') || getContent('../repo')
    if (repoOverride) repo = repoOverride
    if (!repo || !/^[a-z]/.test(repo)) {
        errorAndExit('Invalid repository. Repository name should start with an lowercase letter.')
    }

    const processToRun = depth === 4 ? path.posix.basename(directoryPath) : 'NA'
    const role = ((processToRun.endsWith('Panel') || processToRun.endsWith('Api')) && processToRun !== 'site') ? processToRun.replace('Panel', '').replace('Api', '') : null
    const githubImageName = getContent('./githubImageName')
    const githubImageNameOrProcess = githubImageName || processToRun

    params.org = org
    params.repo = repo
    params.instance = instance
    params.process = processToRun
    params.role = role ? role : ''
    params.home = home
    params.depth = depth
    params.githubImageName = githubImageName || ''
    params.lowercaseGitHubImageName = (githubImageName || '').toLowerCase()
    params.githubImageNameOrProcess = githubImageNameOrProcess
    params.lowercaseGitHubImageNameOrProcess = githubImageNameOrProcess.toLowerCase()
    params.lowercaseOrg = org.toLowerCase()
    params.lowercaseRepo = repo.toLowerCase()
    params.lowercaseInstance = instance.toLowerCase()
    params.lowercaseProcess = processToRun.toLowerCase()
    params.lowercaseRole = role ? role.toLowerCase() : ''
    params.pascalizedProcess = pascalize(params.process)
    params.instancePath = `${home}/${instance}`
    params.processPath = `${home}/${instance}/${processToRun}`
    params.originalProcessPath = `${home}/${repo}/${processToRun}`
    params.level = depth === 3 ? 'instance' : 'process'
    params.environmentRoot = isDev() ? `${params.home}` : '/holism'
    params.fullProcessName = camelize(`${instance} ${githubImageNameOrProcess}`)
    params.composeFile = `${params.processPath}/compose.yaml`
    params.packageFile = `${params.processPath}/package.json`
    params.containerName = `${instance}${params.pascalizedProcess}`

    if (false) {
        success(`Organization: ${org}`)
        success(`Repository: ${repo}`)
        success(`Instance: ${instance}`)
        success(`Process: ${processToRun}`)
        success(`Role: ${role}`)
        success(`ProcessPath=${params.processPath}`)
        success(`OriginalProcessPath=${params.originalProcessPath}`)
    }
    return params
}
