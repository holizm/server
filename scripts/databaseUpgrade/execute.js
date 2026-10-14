import { mkdirSync } from 'fs'
import { join } from 'path'
import artifacts from './artifacts.js'
import checkWriters from './checkWriters.js'
import compose from './compose.js'
import databaseCommand from './databaseCommand.js'
import discover from './discover.js'
import plan from './plan.js'
import settings from './settings.js'
import upgradeTarget from './upgradeTarget.js'

export default async options => {
    const targets = discover(options)
    const report = {
        apply: options.apply,
        targetImage: settings.targetImage,
        targets: [],
    }
    for (const target of targets) {
        const record = {
            completedStages: [],
            container: target.container,
            status: 'planned',
        }
        try {
            if (options.noBackup && !target.composeFile.startsWith('/tmp/')) {
                throw new Error('Skipping backups is restricted to temporary local compositions')
            }
            compose(target)
            if (!target.inspect.State.Running) throw new Error('Start the database with its compatible version before upgrading')
            record.stateBefore = databaseCommand(target.container, 'state')
            target.stages = plan(record.stateBefore, options.enableFeatures)
            record.stages = target.stages
        }
        catch (e) {
            record.error = e.message
            record.status = 'blocked'
        }
        target.record = record
        report.targets.push(record)
    }
    if (!options.apply) return report
    if (report.targets.some(record => record.status === 'blocked')) throw new Error('Preflight blocked; run without --apply for details')
    const storage = artifacts()
    report.directory = storage.directory
    try {
        storage.save(report)
        for (const target of targets) {
            const record = target.record
            if (!target.stages.length) {
                compose(target, settings.targetImage)
                record.status = 'alreadyCurrent'
                storage.save(report)
                continue
            }
            checkWriters(target, options)
        }
        for (const target of targets) {
            if (!target.stages.length) continue
            const directory = join(storage.directory, target.container)
            mkdirSync(directory, { mode: 0o700 })
            target.record.status = 'upgrading'
            storage.save(report)
            const checkpoint = status => {
                target.record.status = status
                storage.save(report)
                console.error(`${target.container}: ${status}`)
            }
            await upgradeTarget(target, options, directory, target.record, checkpoint)
            storage.save(report)
        }
    }
    catch (e) {
        report.error = e.message
        const current = report.targets.find(record => !['alreadyCurrent', 'blocked', 'completed', 'planned'].includes(record.status))
        if (current) current.status = 'failed'
        storage.save(report)
        throw new Error(`Upgrade stopped; writers must remain stopped. Report: ${storage.directory}`)
    }
    finally {
        storage.release()
    }
    return report
}
