import { writeFileSync } from 'fs'
import { join } from 'path'
import { isDeepStrictEqual } from 'util'
import backup from './backup.js'
import compose from './compose.js'
import databaseCommand from './databaseCommand.js'
import probeImage from './probeImage.js'
import run from './run.js'
import settings from './settings.js'
import waitReady from './waitReady.js'

export default async (target, options, directory, record, checkpoint) => {
    checkpoint('checking inventory')
    if (!isDeepStrictEqual(record.stateBefore, databaseCommand(target.container, 'state'))) throw new Error('Database state changed after preflight')
    const before = databaseCommand(target.container, 'inventory')
    writeFileSync(join(directory, 'beforeInventory.json'), JSON.stringify(before, null, 4), { mode: 0o600 })
    record.validationBefore = databaseCommand(target.container, 'validate')
    record.collections = before.length
    record.documents = before.reduce((total, item) => total + (item.count || 0), 0)
    for (const stage of target.stages) {
        checkpoint(`preparing ${stage.image}`)
        try {
            run('docker', ['image', 'inspect', stage.image])
        }
        catch (e) {
            run('docker', ['pull', stage.image])
        }
        await probeImage(target, stage.image, directory)
    }
    run('docker', ['stop', '--timeout', '120', target.container])
    const stopped = JSON.parse(run('docker', ['inspect', target.container]))[0]
    if (stopped.State.Running || stopped.State.ExitCode !== 0) throw new Error('Database did not stop cleanly')
    if (!options.noBackup) {
        checkpoint('creating cold backup')
        record.backup = await backup(target, directory)
    }
    for (const stage of target.stages) {
        const args = compose(target, stage.image)
        checkpoint(`starting ${stage.image}`)
        run('docker', [...args, 'up', '-d', '--no-deps', '--pull', 'never', target.service])
        const state = await waitReady(target.container)
        if (`mongo:${state.version}` !== stage.image) throw new Error('Unexpected running MongoDB version')
        if (!isDeepStrictEqual(before, databaseCommand(target.container, 'inventory'))) throw new Error('Database inventory changed')
        record.validationAfter = databaseCommand(target.container, 'validate')
        if (stage.fcv) {
            checkpoint(`setting FCV ${stage.fcv}`)
            databaseCommand(target.container, 'features', stage.fcv)
            const updated = databaseCommand(target.container, 'state')
            if (updated.fcv.version !== stage.fcv || updated.fcv.targetVersion) throw new Error('FCV change incomplete')
        }
        record.completedStages.push(stage.image)
        checkpoint(`verified ${stage.image}`)
        if (stage !== target.stages.at(-1)) {
            run('docker', ['stop', '--timeout', '120', target.container])
            const stopped = JSON.parse(run('docker', ['inspect', target.container]))[0]
            if (stopped.State.ExitCode !== 0) throw new Error('Intermediate database shutdown failed')
        }
    }
    const after = databaseCommand(target.container, 'inventory')
    writeFileSync(join(directory, 'afterInventory.json'), JSON.stringify(after, null, 4), { mode: 0o600 })
    if (!isDeepStrictEqual(before, after)) throw new Error('Final inventory changed')
    record.stateAfter = databaseCommand(target.container, 'state')
    if (record.stateAfter.version !== settings.targetImage.split(':')[1]) throw new Error('Target version not reached')
    record.status = 'completed'
}
