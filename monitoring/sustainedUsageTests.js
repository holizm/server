import assert from 'assert/strict'
import test from 'node:test'
import { sustainedUsage } from './sustainedUsage.js'

test('alerts once per sustained period of high CPU usage', () => {
    const { getAlert } = sustainedUsage(60_000)
    const sample = (now, usagePercent) => getAlert({
        now,
        resource: 'CPU',
        thresholdPercent: 80,
        usagePercent,
    })

    assert.equal(sample(0, 85), null)
    assert.equal(sample(59_999, 85), null)
    assert.match(sample(60_000, 85), /CPU/)
    assert.equal(sample(120_000, 90), null)

    assert.equal(sample(121_000, 79), null)
    assert.equal(sample(122_000, 85), null)
    assert.equal(sample(181_999, 85), null)
    assert.match(sample(182_000, 85), /CPU/)
})
