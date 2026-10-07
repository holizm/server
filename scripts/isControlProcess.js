export default ({
    instance,
    process,
    repo,
}) => (instance?.endsWith('Control') || repo?.endsWith('Control'))
    && ['api', 'panel'].includes(process)
