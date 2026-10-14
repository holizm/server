import assert from 'assert/strict'
import databaseCommand from './databaseCommand.js'
import run from './run.js'
import waitReady from './waitReady.js'

export default async (fixture, directory, before) => {
    const volume = `${fixture.project}Recovery`
    const container = `${fixture.project}RecoveryDatabases`
    run('docker', ['volume', 'create', volume])
    try {
        run('docker', [
            'run', '--rm', '--network', 'none',
            '--mount', `type=volume,source=${volume},target=/recovery`,
            '--mount', `type=bind,source=${directory},target=/backup,readonly`,
            '--entrypoint', 'tar', 'mongo:8.2',
            '-xf', '/backup/database.tar', '-C', '/recovery', '--strip-components=1',
        ])
        run('docker', [
            'run', '-d', '--name', container, '--network', 'none',
            '--mount', `type=volume,source=${volume},target=/data/db,volume-subpath=db`,
            '--mount', `type=volume,source=${volume},target=/data/configdb,volume-subpath=configdb`,
            '-e', `MONGO_INITDB_ROOT_USERNAME=${fixture.username}`,
            '-e', `MONGO_INITDB_ROOT_PASSWORD=${fixture.password}`,
            'mongo:8.2', '--auth',
        ])
        const state = await waitReady(container)
        assert.equal(state.fcv.version, '8.2')
        assert.deepEqual(databaseCommand(container, 'inventory'), before)
        assert.ok(databaseCommand(container, 'validate').checked > 0)
    }
    finally {
        run('docker', ['rm', '-f', container])
        run('docker', ['volume', 'rm', volume])
    }
}
