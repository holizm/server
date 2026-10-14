import { createHash } from 'crypto'
import {
    closeSync,
    createReadStream,
    openSync,
    readFileSync,
    statSync,
    writeFileSync,
} from 'fs'
import { join } from 'path'
import run from './run.js'

export default async (target, directory) => {
    const archive = join(directory, 'database.tar')
    const paths = target.inspect.Mounts
        .filter(mount => ['/data/db', '/data/configdb'].includes(mount.Destination))
        .map(mount => mount.Destination.slice(1))
    writeFileSync(join(directory, 'originalCompose.yaml'), readFileSync(target.composeFile), { mode: 0o600 })
    writeFileSync(join(directory, 'originalContainer.json'), JSON.stringify(target.inspect, null, 4), { mode: 0o600 })
    const file = openSync(archive, 'wx', 0o600)
    try {
        run('docker', [
            'run', '--rm', '--network', 'none', '--volumes-from', `${target.container}:ro`,
            '--entrypoint', 'tar', target.image, '-cf', '-', '-C', '/', ...paths,
        ], { stdio: ['ignore', file, 'pipe'] })
    }
    finally {
        closeSync(file)
    }
    if (!statSync(archive).size) throw new Error('Empty database backup')
    run('tar', ['-tf', archive], { stdio: 'ignore' })
    const hash = createHash('sha256')
    for await (const chunk of createReadStream(archive)) hash.update(chunk)
    writeFileSync(join(directory, 'databaseChecksum'), hash.digest('hex') + '\n', { mode: 0o600 })
    return archive
}
