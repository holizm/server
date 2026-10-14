import settings from './settings.js'

export default (state, enableFeatures) => {
    const version = state.version.split('.').slice(0, 2).join('.')
    const fcv = state.fcv.version
    if (state.replicaSet || state.sharded) throw new Error('Only standalone MongoDB is supported')
    if (state.fcv.targetVersion || state.fcv.previousVersion) throw new Error('An FCV transition is already in progress')
    const supported = {
        '8.0': ['8.0'],
        '8.2': ['8.2'],
        '8.3': ['8.2', '8.3'],
        '9.0': ['8.0', '8.3', '9.0'],
    }
    if (!supported[version]?.includes(fcv)) throw new Error('Unsupported MongoDB version or FCV')
    if (version === '9.0' && state.version !== settings.targetImage.split(':')[1]) {
        throw new Error('A different 9.0 patch version requires a reviewed upgrade path')
    }
    const stages = []
    if (version === '8.2') stages.push({
        fcv: '8.3',
        image: settings.intermediateImage,
    })
    if (version === '8.3' && fcv === '8.2') stages.push({
        fcv: '8.3',
        image: settings.intermediateImage,
    })
    if (version !== '9.0') stages.push({
        fcv: enableFeatures
            ?
            settings.targetVersion
            :
            '',
        image: settings.targetImage,
    })
    if (version === '9.0' && enableFeatures && fcv !== settings.targetVersion) stages.push({
        fcv: settings.targetVersion,
        image: settings.targetImage,
    })
    return stages
}
