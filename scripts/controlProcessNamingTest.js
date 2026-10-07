import assert from 'assert/strict'
import test from 'node:test'
import calculateSubdomain from './calculateSubdomain.js'
import camelize from './camelize.js'
import isControlProcess from './isControlProcess.js'

test('control process directories are identified from the deployment instance', () => {
    assert.equal(isControlProcess({
        instance: 'jzpControl',
        process: 'api',
        repo: 'jzp',
    }), true)
    assert.equal(isControlProcess({
        instance: 'jzpControl',
        process: 'panel',
        repo: 'jzp',
    }), true)
    assert.equal(isControlProcess({
        instance: 'jzp',
        process: 'api',
        repo: 'jzp',
    }), false)
    assert.equal(camelize('jzpControl api'), 'jzpControlApi')
    assert.equal(camelize('jzpControl panel'), 'jzpControlPanel')
})

test('control process directories preserve control subdomains', () => {
    const api = {
        baseDir: '/missing',
        instance: 'jzpControl',
        process: 'api',
        repo: 'jzp',
    }
    const panel = {
        ...api,
        process: 'panel',
    }
    calculateSubdomain(api)
    calculateSubdomain(panel)
    assert.equal(api.subdomain, 'api.control.')
    assert.equal(panel.subdomain, 'control.')
})
