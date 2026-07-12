import fs from 'fs'
import path from 'path'
import { runOnTerminal } from './terminal.js'

export const isFile = path => {
    return fs.existsSync(path) && fs.statSync(path).isFile()
}

export const getContent = path => {
    if (isFile(path)) {
        const content = fs.readFileSync(path, 'utf8')
        return content
    }
    return ''
}

export const getDirs = path => {
    return fs.readdirSync(path || '.', { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)

}

export const getLines = file =>
    fs.readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .map(s => s.trim())
        .filter(Boolean)

const readReplaceWrite = (inputFile, outputFile, flag, params) => {
    const dir = path.dirname(outputFile)
    fs.mkdirSync(dir, { recursive: true })

    let content = fs.readFileSync(inputFile, 'utf8')
    let prev = null

    while (content !== prev) {
        prev = content
        content = content.replace(/\${(\w+)}/g, (_, v) => params[v] || '')
    }

    fs.writeFileSync(outputFile, content, { flag })
}

export const replaceVariables = (inputFile, outputFile, params) => readReplaceWrite(inputFile, outputFile, 'w', params)

export const replaceVariablesAndAppend = (inputFile, outputFile, params) => readReplaceWrite(inputFile, outputFile, 'a', params)

export const isDev = () => {
    try {
        const out = runOnTerminal('dpkg-vendor --query Vendor').trim()
        if (out) return out === 'Ubuntu'
    } catch { }
    try {
        const raw = getContent('/etc/os-release')
        for (const line of raw.split('\n')) {
            if (line.startsWith('ID=')) {
                const id = line.slice(3).replace(/^'/, '').replace(/'$/, '')
                return id === 'ubuntu'
            }
        }
    } catch { }
    return false
}

export const remove = p => {
    try {
        const st = fs.lstatSync(p, { throwIfNoEntry: false })
        if (!st) return false
        if (st.isDirectory() && !st.isSymbolicLink()) {
            fs.rmSync(p, { recursive: true, force: true })
        } else {
            fs.rmSync(p, { force: true })
        }
        return true
    } catch {
        return false
    }
}

export const getDepth = path => (path.match(/\//g) || []).length

export const excludedDirs = [
    '.vscode',
    'backup',
    'backupDirectory',
    'backupStaging',
    'common',
    'NA',
]

export const createDirIfNotExists = dirPath => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
    }
}

export const setAsExecutableForTheCurrentUser = path => {
    fs.chmodSync(path, 0o755)
    // todo: this runs `chmod +x` which seems to add execution for user/group/world. limit it to the user only
}

export const isProcess = params => {
    const { processPath } = params
    if (getDepth(processPath) !== 4) return false
    const folder = path.basename(processPath)
    const keywords = ['accounts', 'api', 'panel', 'site', 'worker']
    const folderLower = folder.toLowerCase()

    if (keywords.some(k => folderLower.includes(k))) return true

    const files = fs.readdirSync(processPath)
    const pascalFiles = new Set(files.filter(f => fs.statSync(path.join(processPath, f)).isFile()))
    for (const keyword of keywords) {
        if (pascalFiles.has(pascalize(keyword))) return true
    }
    return false
}

export const isAccounts = params => isProcess(params) && path.basename(params.processPath) === 'accounts'
export const isApi = params => isProcess(params) && (['process.js'].some(f => fs.existsSync(path.join(params.processPath, f))) || path.basename(params.processPath).endsWith('Api') || path.basename(params.processPath) === 'etl')
export const isWorker = params => isProcess(params) && path.basename(params.processPath).includes('worker')
export const isPanel = params => isProcess(params) && path.basename(params.processPath).endsWith('Panel')
export const isSite = params => {
    if (!isProcess(params)) return false
    const folder = path.basename(params.processPath)
    const hasSite = folder.toLowerCase().includes('site')
    const hasApi = folder.toLowerCase().includes('api')
    return hasSite && !hasApi
}
export const isHeadlessPanel = params => isPanel(params) && fs.existsSync(path.join(params.processPath, 'headless'))
