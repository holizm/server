import {
    remove,
    replaceVariables,
} from './os.js'

const includeFiles = [
    'certificate',
    'compression',
    'cors',
    'httpsRedirect',
    'listen',
    'proxy',
    'siteBlobs',
    'wwwRedirect',
]

export default params => {
    const {
        domain,
        file,
        home,
        isDev,
        locales,
        processPath,
        subdomain,
        tenant,
    } = params
    const localesList = locales.split(',').map(locale => locale.trim()).filter(Boolean)
    const fileName = includeFiles.includes(file)
        ? file
        : `${subdomain}${domain}.conf`
    const targetPath = `${processPath}/webServer/${tenant}/${fileName}`
    const sourcePath = `${isDev ? home : '/holism'}/server/webServer/${file}`
    const temporaryPath = `${targetPath}.temp`
    const replacements = {
        ...params,
        localesRegex: localesList.join('|'),
    }
    replaceVariables(sourcePath, temporaryPath, replacements)
    replaceVariables(temporaryPath, targetPath, replacements)
    remove(temporaryPath)
}
