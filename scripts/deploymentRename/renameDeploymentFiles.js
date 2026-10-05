import { execFileSync } from 'child_process'
import {
    lstatSync,
    readFileSync,
    readlinkSync,
    renameSync,
    statSync,
    symlinkSync,
    unlinkSync,
    writeFileSync,
} from 'fs'
import path from 'path'
import preserveDatabaseConfigVolume from './preserveDatabaseConfigVolume.js'
import renameFileList from './renameFileList.js'
import { saveRenamePlan } from './renamePlan.js'
import renameReferences from './renameReferences.js'

export default plan => {
    if (plan.stage !== 'stopped') throw new Error('Deployment must be stopped before renaming')
    plan.fileBackups = []
    renameSync(plan.oldPath, plan.newPath)
    saveRenamePlan(plan)
    for (const file of renameFileList(plan.newPath)) {
        const symlink = lstatSync(file).isSymbolicLink()
        const source = symlink
            ?
            readlinkSync(file)
            :
            readFileSync(file)
        if (!symlink && source.includes(0)) continue
        const original = source.toString()
        const renamed = renameReferences(original, plan)
        if (original === renamed) continue
        plan.fileBackups.push({
            file,
            original,
            symlink,
        })
        saveRenamePlan(plan)
        if (symlink) {
            unlinkSync(file)
            symlinkSync(renamed, file)
        }
        else writeFileSync(file, renamed)
    }
    if (plan.dataInode !== null && statSync(path.join(plan.newPath, 'databases', 'data')).ino !== plan.dataInode) throw new Error('Database directory identity changed')
    preserveDatabaseConfigVolume(plan)
    if (plan.crontab) {
        const currentCrontab = execFileSync('crontab', ['-l'], { encoding: 'utf8' })
        execFileSync('crontab', ['-'], { input: renameReferences(currentCrontab, plan) })
    }
    plan.stage = 'renamed'
    saveRenamePlan(plan)
    console.log('Renamed ' + plan.oldName + ' to ' + plan.newName + '; database files preserved')
}
