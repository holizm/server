import path from 'path'
import { pathToFileURL } from 'url'
import getComposePort from './getComposePort.js'
import getRuntimeProcessExpectations from './getRuntimeProcessExpectations.js'
import {
    getContent,
    isFile,
} from './os.js'

const getSavedRuntimeProcessExpectations = states => {
    const processes = states.map(state => {
        const process = {
            name: state.name,
            pid: state.pid,
            pm2_env: state,
        }
        return process
    })
    const expected = getRuntimeProcessExpectations(processes, (pid, process) => {
        const composeFile = path.join(process.pm2_env.pm_cwd, 'compose.yaml')
        return isFile(composeFile) ? getComposePort({ composeFile }) : ''
    })
    return expected
}

export default getSavedRuntimeProcessExpectations

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    console.log(JSON.stringify(getSavedRuntimeProcessExpectations(JSON.parse(getContent(process.argv[2])))))
}
