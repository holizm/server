import { randomInt } from 'crypto'
import {
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import run from './run.js'
import waitReady from './waitReady.js'

const credential = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let value
    do {
        value = Array.from({ length: 20 }, () => characters[randomInt(characters.length)]).join('')
    } while (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/\d/.test(value))
    return value
}

export default async () => {
    const directory = mkdtempSync(join(tmpdir(), 'databaseUpgradeIntegration'))
    const container = `upgradeTest${process.pid}Databases`
    const project = `upgradetest${process.pid}`
    const file = join(directory, 'compose.yaml')
    const username = credential()
    const password = credential()
    writeFileSync(file, [
        'services:',
        '    database:',
        '        image: mongo:8.2',
        `        container_name: ${container}`,
        '        environment:',
        '            GLIBC_TUNABLES: glibc.pthread.rseq=1',
        `            MONGO_INITDB_ROOT_PASSWORD: ${password}`,
        `            MONGO_INITDB_ROOT_USERNAME: ${username}`,
        '        volumes:',
        '            - databaseData:/data/db',
        '            - databaseConfig:/data/configdb',
        'volumes:',
        '    databaseConfig:',
        '    databaseData:',
        '',
    ].join('\n'), { mode: 0o600 })
    const composeArgs = ['compose', '-p', project, '-f', file]
    const program = [
        'db.getSiblingDB(\'admin\').auth(process.env.MONGO_INITDB_ROOT_USERNAME, process.env.MONGO_INITDB_ROOT_PASSWORD)',
        'const database = db.getSiblingDB(\'upgradeFixture\')',
        'database.items.insertMany([{title: \'First\'}, {title: \'Second\'}])',
        'database.items.createIndex({title: 1}, {unique: true})',
        'database.createView(\'itemTitles\', \'items\', [{$project: {title: 1}}])',
    ].join('\n')
    try {
        run('docker', [...composeArgs, 'up', '-d', '--pull', 'never'])
        await waitReady(container)
        run('docker', ['exec', '-i', container, 'mongosh', '--quiet', '--file', '/dev/stdin'], { input: program })
    }
    catch (e) {
        run('docker', [...composeArgs, 'down', '--volumes'])
        rmSync(directory, {
            force: true,
            recursive: true,
        })
        throw e
    }
    const fixture = {
        composeArgs,
        container,
        directory,
        password,
        project,
        username,
    }
    return fixture
}
