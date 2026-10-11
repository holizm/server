import path from 'path'
import {
    excludedDirs,
    getDirs,
    isApi,
    isFile,
    isPanel,
    isSite,
} from './os.js'
import extract from './extract.js'

export default (instanceParams, filter) => {
    const { instancePath, instance, repo } = instanceParams
    const control = instance.endsWith('Control') || repo.endsWith('Control')
    const themes = instance.endsWith('Themes') || repo.endsWith('Themes')
    const stages = themes ? [['site']] : control
        ? [['api'], ['panel']]
        : [['databases', 'search', 'cache'], ['api'], ['panel'], ['site']]
    const selected = getDirs(instancePath)
        .filter(directory => !excludedDirs.includes(directory))
        .filter(directory => !filter || new RegExp(filter).test(directory))
        .map(directory => {
            const directoryPath = path.join(instancePath, directory)
            const previousDirectory = process.cwd()
            let params
            try {
                process.chdir(directoryPath)
                params = extract({ directoryPath, home: instanceParams.home })
            }
            finally {
                process.chdir(previousDirectory)
            }
            const kind = ['databases', 'search', 'cache'].includes(directory)
                ? directory
                : isApi(params) ? 'api' : isPanel(params) ? 'panel' : isSite(params) ? 'site' : ''
            return { kind, params }
        })
        .filter(({ kind, params }) => kind && (
            isFile(params.packageFile)
            || isFile(path.join(params.processPath, 'index.html'))
            || isFile(params.composeFile)
        ))
    return stages.map(kinds => kinds.flatMap(kind => selected.filter(item => item.kind === kind)))
}
