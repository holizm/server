import fs from 'fs'
import path from 'path'
import isControlProcess from './isControlProcess.js'
import pascalize from './pascalize.js'

export const getDepth = value => (value.match(/\//g) || []).length

export const isProcess = params => {
    const { processPath } = params
    if (getDepth(processPath) !== 4) return false
    const folder = path.basename(processPath)
    const keywords = ['accounts', 'api', 'panel', 'site', 'worker']
    const folderLower = folder.toLowerCase()

    if (keywords.some(keyword => folderLower.includes(keyword))) return true

    const files = fs.readdirSync(processPath)
    const pascalFiles = new Set(files.filter(file => fs.statSync(path.join(processPath, file)).isFile()))
    for (const keyword of keywords) {
        if (pascalFiles.has(pascalize(keyword))) return true
    }
    return false
}

export const isAccounts = params => isProcess(params) && path.basename(params.processPath) === 'accounts'

export const isApi = params => isProcess(params) && (
    fs.existsSync(path.join(params.processPath, 'process.js'))
    || path.basename(params.processPath).endsWith('Api')
    || path.basename(params.processPath) === 'etl'
    || (isControlProcess(params) && path.basename(params.processPath) === 'api')
)

export const isWorker = params => isProcess(params) && path.basename(params.processPath).includes('worker')

export const isPanel = params => isProcess(params) && (
    path.basename(params.processPath).endsWith('Panel')
    || (isControlProcess(params) && path.basename(params.processPath) === 'panel')
)

export const isSite = params => {
    if (!isProcess(params)) return false
    const folder = path.basename(params.processPath)
    const hasSite = folder.toLowerCase().includes('site')
    const hasApi = folder.toLowerCase().includes('api')
    return hasSite && !hasApi
}

export const isHeadlessPanel = params => isPanel(params)
    && fs.existsSync(path.join(params.processPath, 'headless'))
