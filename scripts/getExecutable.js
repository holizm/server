import fs from 'fs'

export default (name, paths) => {
    for (const path of paths) {
        try {
            fs.accessSync(path, fs.constants.X_OK)
            return path
        }
        catch (e) {}
    }

    throw new Error(`${name} executable was not found in: ${paths.join(', ')}`)
}
