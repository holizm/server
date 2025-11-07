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
    fs.mkdirSync(path.dirname(outputFile), { recursive: true })
    const content = fs.readFileSync(inputFile, 'utf8')
    const replaced = content.replace(/\${(\w+)}/g, (_, v1, v2) => params[v1 || v2] || '')
    fs.writeFileSync(outputFile, replaced, { flag })
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

