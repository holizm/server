import assert from 'assert/strict'
import {
    mock,
    test,
} from 'node:test'

const calls = []
mock.module('../scripts/os.js', { namedExports: {
    isApi: () => false,
    isFile: () => true,
    isPanel: () => false,
    isSite: () => true,
} })
mock.module('../scripts/extract.js', { defaultExport: () => {
    const params = {
        fullProcessName: 'sampleSite',
        level: 'process',
        packageFile: 'package.json',
    }
    return params
} })
mock.module('../scripts/getComposePort.js', { defaultExport: () => '41000' })
mock.module('../scripts/getListeningPort.js', { defaultExport: () => '' })
mock.module('../scripts/startInstance.js', { defaultExport: () => {} })
mock.module('../scripts/terminal.js', { exports: {
    clear: () => {},
    runOnTerminal: (command, throwOnError, hideError) => {
        calls.push(command)
        if (command.startsWith('pm2 pid ')) {
            if (throwOnError || !hideError) throw Error('Unregistered PM2 process')
            return ''
        }
        return ''
    },
} })

test('Starts an unregistered published site despite the expected missing-process PID response', async () => {
    await import('./start')
    assert.ok(calls.includes('PORT=41000 pm2 start server/entry.express.js --name sampleSite'))
    assert.equal(calls.at(-1), 'pm2 save')
})
