import assert from 'assert/strict'
import test from 'node:test'
import buildCaddyStorageMap from './buildCaddyStorageMap.js'

test('maps exact storage hosts to canonical tenant IDs', () => {
    const result = buildCaddyStorageMap([
        {
            domain: 'secondhotel.ir',
            id: 'secondHotel',
        },
        {
            domain: 'hotelos.ir',
            id: 'hotelOs',
        },
    ])
    assert.equal(result, 'storage.hotelos.ir hotelOs\nstorage.secondhotel.ir secondHotel')
})

test('rejects unsafe tenant IDs and duplicate domains', () => {
    assert.throws(() => buildCaddyStorageMap([{
        domain: 'hotelos.ir',
        id: '../other',
    }]))
    assert.throws(() => buildCaddyStorageMap([
        {
            domain: 'hotelos.ir',
            id: 'hotelOs',
        },
        {
            domain: 'hotelos.ir',
            id: 'otherHotel',
        },
    ]))
})
