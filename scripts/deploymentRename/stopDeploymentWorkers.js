import { execFileSync } from 'child_process'
import { readlinkSync } from 'fs'

export default async plan => {
    const lines = execFileSync('ps', ['-u', String(process.getuid()), '-o', 'pid=,args='], { encoding: 'utf8' }).trim().split('\n')
    const workers = []
    for (const line of lines) {
        const [pidText, ...rest] = line.trim().split(/\s+/)
        const command = rest.join(' ')
        const pid = Number(pidText)
        if (!/^(?:\S*\/)?node(?:\s|$)/.test(command) || pid === process.pid) continue
        try {
            const directory = readlinkSync('/proc/' + pid + '/cwd')
            if (![plan.oldPath, plan.newPath].filter(Boolean).some(root => directory === root || directory.startsWith(root + '/'))) continue
            process.kill(pid, 'SIGTERM')
            workers.push(pid)
        }
        catch (e) {
            if (!['ENOENT', 'ESRCH'].includes(e.code)) throw e
        }
    }
    for (const pid of workers) {
        for (let attempt = 0; attempt < 10; attempt++) {
            try {
                process.kill(pid, 0)
            }
            catch (e) {
                if (e.code === 'ESRCH') break
                throw e
            }
            if (attempt === 9) throw new Error('Deployment worker did not stop: ' + pid)
            await new Promise(resolve => setTimeout(resolve, 1000))
        }
    }
    plan.stoppedWorkers = workers
}
