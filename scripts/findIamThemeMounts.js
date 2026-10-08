import fs from 'fs'
import path from 'path'

const isDirectory = value => fs.existsSync(value) && fs.statSync(value).isDirectory()

export default environmentRoot => {
    const mounts = []
    const names = new Set()
    const repositories = fs.readdirSync(environmentRoot, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && /^[a-z][a-zA-Z0-9]*$/.test(entry.name))
        .filter(entry => isDirectory(path.join(environmentRoot, entry.name, '.git')))
        .filter(entry => isDirectory(path.join(environmentRoot, entry.name, 'common')))
        .sort((a, b) => a.name.localeCompare(b.name))

    for (const repository of repositories) {
        const root = path.join(environmentRoot, repository.name)
        const baseName = repository.name.replace(/Themes$/, '')
        const owners = fs.readdirSync(root, { withFileTypes: true })
            .filter(entry => entry.isDirectory() && (entry.name === 'site' || /^theme\d{1,3}$/.test(entry.name)))
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

        for (const owner of owners) {
            const source = path.join(root, owner.name, 'iamTheme')
            if (!isDirectory(source) || !fs.existsSync(path.join(source, 'login', 'theme.properties'))) continue
            const suffix = owner.name === 'site'
                ?
                ''
                :
                `${owner.name[0].toUpperCase()}${owner.name.slice(1)}`
            const name = `${baseName}${suffix}`
            if (names.has(name)) throw new Error(`Duplicate IAM theme name: ${name}`)
            names.add(name)
            mounts.push({
                name,
                source,
            })
        }
    }

    return mounts
}
