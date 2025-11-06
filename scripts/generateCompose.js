import { replaceVariables } from './os.js'

export default params => {
    const {
        file,
        processPath,
    } = params
    const sourceFile = `/gesht/server/composes/${file}`
    const targetFile = `${processPath}/compose.yaml`
    replaceVariables(sourceFile, targetFile, params)
}
