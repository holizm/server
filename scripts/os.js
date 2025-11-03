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

export const readLines = file =>
    fs.readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .map(s => s.trim())
        .filter(Boolean)
