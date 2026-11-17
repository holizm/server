import assert from 'assert/strict'
import test from 'node:test'
import getRuntimeProcessExpectations from './getRuntimeProcessExpectations.js'

test('only running applications enter the recovery contract', () => {
    const processes = [
        {
            name: 'site',
            pid: 123,
            pm2_env: { status: 'online' },
        },
        {
            name: 'paused',
            pid: 0,
            pm2_env: { status: 'stopped' },
        },
    ]
    assert.deepEqual(getRuntimeProcessExpectations(processes, () => '4000'), [{
        name: 'site',
        port: '4000',
    }])
})
