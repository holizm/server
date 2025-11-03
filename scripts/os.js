import fs from 'fs'

export const isFile = path => {
    return fs.existsSync(path) && fs.statSync(path).isFile()
}
