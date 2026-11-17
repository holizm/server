import assert from 'assert/strict'
import { spawnSync } from 'child_process'
import fs from 'fs'
import test from 'node:test'
import createEnvironment from '../testing/runtimeUpdateEnvironmentProvider.js'

for (const scenario of ['success', 'startFailure', 'partialRecovery', 'permanentFailure', 'interrupted', 'empty']) {
    test(`runtime update preserves applications during ${scenario}`, () => {
        const environment = createEnvironment()
        try {
            const command = new URL('./updateServerRuntime', import.meta.url).pathname
            const result = spawnSync('bash', [command, 'ownerabcdefghijklmno'], {
                encoding: 'utf8',
                env: {
                    ...environment.env,
                    runtimeTestScenario: scenario,
                },
                timeout: 10000,
            })
            assert.equal(result.status, ['success', 'empty'].includes(scenario) ? 0 : 1, result.stderr)
            const calls = fs.readFileSync(environment.env.runtimeTestCalls, 'utf8')
            assert.doesNotMatch(calls, /pm2 update|docker/)
            assert.equal((calls.match(/pm2 save/g) || []).length, scenario === 'empty' ? 0 : scenario === 'success' ? 2 : 1)
            assert.equal(fs.existsSync(environment.snapshot), scenario === 'permanentFailure')
            if (['startFailure', 'partialRecovery', 'interrupted'].includes(scenario)) assert.match(result.stderr, /Recovery verified/)
            if (scenario === 'permanentFailure') {
                assert.match(result.stderr, /ALERT/)
                const snapshot = fs.readFileSync(environment.snapshot, 'utf8')
                assert.equal(snapshot, fs.readFileSync(environment.env.runtimeTestBaseline, 'utf8'))
                const retry = spawnSync('bash', [command, 'ownerabcdefghijklmno'], { env: environment.env })
                assert.equal(retry.status, 1)
                assert.equal(fs.readFileSync(environment.snapshot, 'utf8'), snapshot)
            }
        } finally {
            fs.rmSync(environment.directory, {
                force: true,
                recursive: true,
            })
        }
    })
}
