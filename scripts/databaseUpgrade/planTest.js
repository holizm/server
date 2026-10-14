import assert from 'assert/strict'
import test from 'node:test'
import plan from './plan.js'

const state = (version, fcv) => {
    const value = {
        fcv: { version: fcv },
        replicaSet: false,
        sharded: false,
        version,
    }
    return value
}

test('8.2 uses the intermediate release and retains final FCV during observation', () => {
    assert.deepEqual(plan(state('8.2.12', '8.2'), false), [
        {
            fcv: '8.3',
            image: 'mongo:8.3.13',
        },
        {
            fcv: '',
            image: 'mongo:9.0.2',
        },
    ])
})

test('explicit feature activation and resumed intermediate upgrades use valid stages', () => {
    assert.equal(plan(state('8.2.12', '8.2'), true).at(-1).fcv, '9.0')
    assert.equal(plan(state('8.3.13', '8.2'), false)[0].fcv, '8.3')
    assert.deepEqual(plan(state('8.3.13', '8.3'), false).map(stage => stage.image), ['mongo:9.0.2'])
    assert.equal(plan(state('8.0.12', '8.0'), false).length, 1)
    assert.equal(plan(state('9.0.2', '8.3'), true)[0].fcv, '9.0')
    assert.deepEqual(plan(state('9.0.2', '9.0'), true), [])
})

test('unsupported versions, topologies and interrupted FCV changes fail closed', () => {
    for (const value of [
        state('7.0.12', '7.0'),
        state('8.2.12', '8.0'),
        state('9.0.3', '9.0'),
        {
            ...state('8.2.12', '8.2'),
            replicaSet: true,
        },
        {
            ...state('8.2.12', '8.2'),
            sharded: true,
        },
        {
            ...state('8.2.12', '8.2'),
            fcv: {
                targetVersion: '8.3',
                version: '8.2',
            },
        },
    ]) assert.throws(() => plan(value, true))
})
