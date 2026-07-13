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
    const backupWithNodeTemplatePath = `${environmentRoot}/server/instance/backupWithNode`
    const restoreTemplatePath = `${environmentRoot}/server/instance/restore`

    const backupTarget = `${home}/${instance}/backup`
    const backupWithNodeTarget = `${home}/${instance}/backupWithNode`
    const restoreTarget = `${home}/${instance}/restore`

    replaceVariables(backupTemplatePath, backupTarget, params)
    replaceVariables(backupWithNodeTemplatePath, backupWithNodeTarget, params)
    replaceVariables(restoreTemplatePath, restoreTarget, params)
    setAsExecutableForTheCurrentUser(backupTarget)
    setAsExecutableForTheCurrentUser(backupWithNodeTarget)
    setAsExecutableForTheCurrentUser(restoreTarget)
}
