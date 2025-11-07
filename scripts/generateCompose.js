import { replaceVariables } from './os.js'

export default params => {
    const {
        file,
        isDev,
        processPath,
    } = params
    const sourceFile = `${isDev ? home : "/gesht"}/server/composes/${file}`
    const targetFile = `${processPath}/compose.yaml`
    replaceVariables(sourceFile, targetFile, params)
}
