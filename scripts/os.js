import fs from 'fs'

export const isFile = path => {
    return fs.existsSync(path) && fs.statSync(path).isFile()
}

export const getContent = path => {
    if (isFile(path)) {
        const content = fs.readFileSync(path, "utf8")
        return content
    }
    return ""
}

export const getDirs = path => {
    return fs.readdirSync('.', { withFileTypes: true })
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
    const content = fs.readFileSync(inputFile, "utf8")
    const replaced = content.replace(/\${(\w+)}/g, (_, v1, v2) => params[v1 || v2] || "")
    fs.writeFileSync(outputFile, replaced, { flag })
}

export const replaceVariables = (inputFile, outputFile, params) => readReplaceWrite(inputFile, outputFile, "w", params)

export const replaceVariablesAndAppend = (inputFile, outputFile, params) => readReplaceWrite(inputFile, outputFile, "a", params)
