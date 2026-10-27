import { execFileSync } from 'child_process'
import path from 'path'
import { azureStorage } from '../azureStorage.js'
import getExecutable from '../getExecutable.js'

export default ({
    backupDirectory,
    config,
    instancePath,
}) => {
    const azure = config.storageProvider === 'azure' ? azureStorage(instancePath) : null
    if (!azure && config.storageProvider !== 'aws') throw new Error('Unsupported storageProvider: ' + config.storageProvider)
    if (!azure) {
        for (const property of ['awsEndpoint', 'awsAccessKey', 'awsSecretKey', 'awsBucket']) {
            if (!config[property]) throw new Error('Missing backup setting: ' + property)
        }
    }
    const rclone = azure ? null : getExecutable('rclone', ['/usr/local/bin/rclone', '/usr/bin/rclone'])
    const remote = ':s3:' + config.awsBucket + '/backup'
    const environment = {
        ...process.env,
        RCLONE_S3_ACCESS_KEY_ID: config.awsAccessKey,
        RCLONE_S3_ACL: 'private',
        RCLONE_S3_ENDPOINT: config.awsEndpoint,
        RCLONE_S3_PROVIDER: 'Other',
        RCLONE_S3_SECRET_ACCESS_KEY: config.awsSecretKey,
    }
    const run = (args, capture) => execFileSync(rclone, [...args, '--config', '/dev/null'], {
        encoding: 'utf8',
        env: environment,
        stdio: ['ignore', capture ? 'pipe' : 'inherit', 'inherit'],
        timeout: 900000,
    })
    const storage = {
        listPaths: () => azure
            ? azure(['storage', 'blob', 'list', '--container-name=backup', '--num-results=*', '--query=[].name', '--output=tsv'], true)
            : run(['lsf', remote, '--dirs-only'], true),
        markCompleted: timestamp => {
            const completed = path.join(backupDirectory, 'completed')
            if (azure) azure([
                'storage', 'blob', 'upload', '--container-name', 'backup',
                '--name', timestamp + '/completed', '--file', completed,
                '--overwrite', 'true', '--output', 'none',
            ])
            else run(['copyto', completed, remote + '/' + timestamp + '/completed'])
        },
        removeSnapshot: timestamp => {
            if (azure) azure([
                'storage', 'blob', 'delete-batch', '--source', 'backup',
                '--pattern', timestamp + '/*', '--output', 'none',
            ])
            else run(['purge', remote + '/' + timestamp])
        },
        upload: timestamp => {
            if (azure) azure([
                'storage', 'blob', 'upload-batch', '--destination', 'backup',
                '--destination-path', timestamp, '--source', backupDirectory,
                '--overwrite', 'true', '--output', 'none',
            ])
            else run(['copy', backupDirectory, remote + '/' + timestamp])
        },
    }
    return storage
}
