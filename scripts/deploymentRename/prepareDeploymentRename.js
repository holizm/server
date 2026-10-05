import { execFileSync } from 'child_process'
import {
    existsSync,
    readFileSync,
    statSync,
} from 'fs'
import path from 'path'
import { saveRenamePlan } from './renamePlan.js'

export default async params => {
    const oldPath = path.join(params.home, params.oldName)
    const newPath = path.join(params.home, params.newName)
    if (!existsSync(oldPath) || existsSync(newPath) || existsSync(params.planFile)) throw new Error('Source, target, or saved plan prevents rename')
    const repo = readFileSync(path.join(oldPath, 'repo'), 'utf8').trim()
    if (repo !== params.newName) throw new Error('New deployment name must match the canonical repository name')
    const processes = JSON.parse(execFileSync('pm2', ['jlist'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }))
        .filter(process => process.pm2_env.pm_cwd === oldPath || process.pm2_env.pm_cwd.startsWith(oldPath + '/'))
    const ids = execFileSync('docker', ['ps', '-aq'], { encoding: 'utf8' }).trim().split(/\s+/).filter(Boolean)
    const containers = ids.length
        ?
        JSON.parse(execFileSync('docker', ['inspect', ...ids], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }))
            .filter(container => container.Mounts.some(mount => mount.Source.startsWith(oldPath + '/')) || container.Name === '/' + params.oldName + 'Cache')
        :
        []
    let crontab = ''
    try {
        crontab = execFileSync('crontab', ['-l'], { encoding: 'utf8' })
    }
    catch (e) {
        if (e.status !== 1) throw e
    }
    const dataPath = path.join(oldPath, 'databases', 'data')
    const plan = {
        ...params,
        containers,
        crontab,
        dataInode: existsSync(dataPath)
            ?
            statSync(dataPath).ino
            :
            null,
        newPath,
        oldPath,
        processes,
        stage: 'prepared',
    }
    saveRenamePlan(plan)
    console.log('Prepared ' + params.oldName + ': ' + processes.length + ' processes, ' + containers.length + ' containers')
}
