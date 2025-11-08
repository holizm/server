import { replaceVariables } from './os.js'

export default params => {
    const {
        environmentRoot,
        home,
        instance,
    } = params

    let backupTemplatePath = `${environmentRoot}/server/instance/backup`
    let restoreTemplatePath = `${environmentRoot}/server/instance/restore`

    const backupTarget = `${home}/${instance}/backup`
    const restoreTarget = `${home}/${instance}/restore`

    replaceVariables(backupTemplatePath, backupTarget, params)
    replaceVariables(restoreTemplatePath, restoreTarget, params)
}
