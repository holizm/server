import assert from 'assert/strict'
import test from 'node:test'
import verifyRuntimeProcesses from './verifyRuntimeProcesses.js'

test('partial restores, stopped applications and changed ports fail readiness', () => {
    const expected = [{
        name: 'site',
        port: '4000',
    }]
    const current = [{
        name: 'site',
        pid: 123,
        pm2_env: { status: 'online' },
    }]
    assert.equal(verifyRuntimeProcesses(expected, current, () => '4000'), true)
    assert.equal(verifyRuntimeProcesses(expected, [], () => '4000'), false)
    assert.equal(verifyRuntimeProcesses(expected, current, () => ''), false)
    assert.equal(verifyRuntimeProcesses(expected, current, () => '5000'), false)
    current[0].pm2_env.status = 'stopped'
    assert.equal(verifyRuntimeProcesses(expected, current, () => '4000'), false)
})
