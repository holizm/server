import renameReferences from './renameReferences.js'

export default (process, plan) => {
    const previous = process.pm2_env
    const replace = value => {
        if (typeof value === 'string') return renameReferences(value, plan)
        if (Array.isArray(value)) return value.map(replace)
        if (value && typeof value === 'object') {
            const result = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replace(item)]))
            return result
        }
        return value
    }
    const config = {
        args: replace(previous.args || []),
        cwd: replace(previous.pm_cwd),
        env: replace(previous.env || {}),
        exec_mode: previous.exec_mode === 'cluster_mode' ? 'cluster' : 'fork',
        instances: previous.instances || 1,
        interpreter: previous.exec_interpreter,
        name: plan.newName + process.name.slice(plan.oldName.length),
        node_args: previous.node_args || [],
        script: replace(previous.pm_exec_path),
    }
    if (previous.max_memory_restart) config.max_memory_restart = previous.max_memory_restart
    return config
}
