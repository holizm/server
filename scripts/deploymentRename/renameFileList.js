import {
    existsSync,
    lstatSync,
    readdirSync,
} from 'fs'
import path from 'path'

const excluded = new Set(['backupDirectory', 'certificates', 'data', 'storage', '.git'])

export default root => {
    const files = []
    const visit = directory => {
        for (const name of readdirSync(directory)) {
            const file = path.join(directory, name)
            const stat = lstatSync(file)
            if (stat.isSymbolicLink()) files.push(file)
            else if (stat.isDirectory() && name === 'node_modules') {
                for (const module of readdirSync(file)) {
                    const modulePath = path.join(file, module)
                    if (lstatSync(modulePath).isSymbolicLink()) files.push(modulePath)
                    else if (existsSync(path.join(modulePath, 'exports.js'))) files.push(path.join(modulePath, 'exports.js'))
                }
            }
            else if (stat.isDirectory() && !excluded.has(name)) {
                if (name === 'statics') {
                    if (existsSync(path.join(file, 'webServer'))) visit(path.join(file, 'webServer'))
                }
                else visit(file)
            }
            else if (stat.isFile() && stat.size < 16 * 1024 * 1024) files.push(file)
        }
    }
    visit(root)
    return files
}
