import {
    replaceVariables,
    setAsExecutableForTheCurrentUser,
} from './os.js'

export default params => {
    const {
        environmentRoot,
        home,
        instance,
    } = params

    const backupTemplatePath = `${environmentRoot}/server/instance/backup`
    const restoreTemplatePath = `${environmentRoot}/server/instance/restore`

    const backupTarget = `${home}/${instance}/backup`
    const restoreTarget = `${home}/${instance}/restore`

    replaceVariables(backupTemplatePath, backupTarget, params)
    replaceVariables(restoreTemplatePath, restoreTarget, params)
    setAsExecutableForTheCurrentUser(backupTarget)
    setAsExecutableForTheCurrentUser(restoreTarget)
}
