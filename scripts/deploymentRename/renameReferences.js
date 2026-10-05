export default (value, plan) => {
    const {
        home,
        newName,
        oldName,
    } = plan
    if (value === oldName) return newName
    if (value === home + '/' + oldName) return home + '/' + newName
    let result = value.replaceAll(home + '/' + oldName + '/', home + '/' + newName + '/')
    for (const suffix of ['Databases', 'Cache', 'Network']) {
        result = result.replaceAll(oldName + suffix, newName + suffix)
    }
    for (const delimiter of ["'", '"']) {
        result = result.replaceAll(delimiter + oldName + delimiter, delimiter + newName + delimiter)
        result = result.replaceAll(delimiter + home + '/' + oldName + delimiter, delimiter + home + '/' + newName + delimiter)
    }
    return result
}
