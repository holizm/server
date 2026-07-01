import fs from 'fs'
import { execSync } from 'child_process'
import { error, warning } from './logger.js'
import extract from './extract.js'
import calculateSubdomain from './calculateSubdomain.js'
import getRandomPort from './getRandomPort.js'
import generateWebServerConfig from './generateWebServerConfig.js'
import generateCompose from './generateCompose.js'
import { isFile } from './os.js'
import pascalize from './pascalize.js'
import { runOnTerminal } from './terminal.js'

export default params => {
    const {
        tenants,
        role,
    } = params
    getRandomPort(params)
    params = extract(params)
    const {
        home,
        instance,
        process,
    } = params
    calculateSubdomain(params)
    params[`${instance}${pascalize(process)}Port`] = params.randomPort
    params.dockerImageName = `ghcr.io/${params.lowercaseOrg}/${params.lowercaseRepo}/${params.lowercaseGitHubImageNameOrProcess}:latest`
    generateCompose(params)
    generateWebServerConfig(params)
    if (process === 'statics') {
        runOnTerminal(`rsync -a --delete --exclude='.git' /holism/serverFonts/. ${home}/${instance}/statics/fonts`)
    }
}
