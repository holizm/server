import assert from 'assert/strict'
import {
    readFileSync,
    rmSync,
} from 'fs'
import { join } from 'path'
import test from 'node:test'
import databaseCommand from '../../../scripts/databaseUpgrade/databaseCommand.js'
import execute from '../../../scripts/databaseUpgrade/execute.js'
import integrationFixture from '../../../testing/scripts/databaseUpgrade/databaseUpgradeEnvironmentProvider.js'
import parseArguments from '../../../scripts/databaseUpgrade/parseArguments.js'
import run from '../../../scripts/databaseUpgrade/run.js'
import verifyBackupRestore from '../../../scripts/databaseUpgrade/verifyBackupRestore.js'

test('cold backup, full upgrade, observation, activation and rerun preserve data', {
    skip: process.env.runDatabaseUpgradeIntegration !== 'true',
}, async () => {
    const fixture = await integrationFixture()
    const flags = [fixture.container, '--local', '--apply', '--writersStopped', '--backupVerified']
    try {
        const before = databaseCommand(fixture.container, 'inventory')
        const preview = await execute(parseArguments([fixture.container, '--local']))
        assert.equal(preview.targets[0].stages.length, 2)
        assert.equal(databaseCommand(fixture.container, 'state').fcv.version, '8.2')
        const writer = fixture.container.replace(/Databases$/, 'Api')
        run('docker', ['run', '-d', '--name', writer, '--network', `${fixture.project}_default`, '--entrypoint', 'tail', 'mongo:8.2', '-f', '/dev/null'])
        try {
            await assert.rejects(() => execute(parseArguments(flags)))
            assert.equal(databaseCommand(fixture.container, 'state').fcv.version, '8.2')
        }
        finally {
            run('docker', ['rm', '-f', writer])
        }
        const report = await execute(parseArguments(flags))
        assert.equal(report.targets[0].status, 'completed')
        assert.equal(report.targets[0].stateAfter.version, '9.0.2')
        assert.equal(report.targets[0].stateAfter.fcv.version, '8.3')
        assert.deepEqual(databaseCommand(fixture.container, 'inventory'), before)
        assert.equal(readFileSync(join(fixture.directory, 'databaseImage'), 'utf8').trim(), 'mongo:9.0.2')
        await verifyBackupRestore(fixture, join(report.directory, fixture.container), before)
        const activated = await execute(parseArguments([...flags, '--enableFeatures']))
        assert.equal(activated.targets[0].stateAfter.fcv.version, '9.0')
        assert.deepEqual(databaseCommand(fixture.container, 'inventory'), before)
        const rerun = await execute(parseArguments([...flags, '--enableFeatures']))
        assert.equal(rerun.targets[0].status, 'alreadyCurrent')
        console.log(`Integration evidence: ${report.directory}`)
    }
    catch (e) {
        const logs = run('docker', ['logs', fixture.container]).split('\n').filter(line => /"s":"[FE]"/.test(line))
        console.error(logs.join('\n'))
        throw e
    }
    finally {
        run('docker', [...fixture.composeArgs, 'down', '--volumes'])
        rmSync(fixture.directory, {
            force: true,
            recursive: true,
        })
    }
})
