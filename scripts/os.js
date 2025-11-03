import fs from 'fs'

export const isFile = path => {
    return fs.existsSync(path) && fs.statSync(path).isFile()
}

export const getDirs = path => {
    return fs.readdirSync('.', { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)

}
