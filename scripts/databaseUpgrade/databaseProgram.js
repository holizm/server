const admin = db.getSiblingDB('admin')
const username = process.env.MONGO_INITDB_ROOT_USERNAME
const password = process.env.MONGO_INITDB_ROOT_PASSWORD
if (!username || !password || !admin.auth(username, password)) throw new Error('authenticationFailed')
const check = result => {
    if (result.ok !== 1) throw new Error('databaseCommandFailed')
    return result
}
const action = process.env.upgradeAction
const normalizeIndex = index => {
    const normalized = {
        ...index,
        collation: index.collation || { locale: 'simple' },
    }
    return normalized
}
let output
if (action === 'state') {
    const fcv = check(admin.runCommand({
        getParameter: 1,
        featureCompatibilityVersion: 1,
    })).featureCompatibilityVersion
    const hello = check(admin.runCommand({ hello: 1 }))
    output = {
        fcv,
        replicaSet: Boolean(hello.setName),
        sharded: hello.msg === 'isdbgrid',
        version: db.version(),
    }
}
else if (action === 'features') {
    output = check(admin.runCommand({
        setFeatureCompatibilityVersion: process.env.upgradeFcv,
        confirm: true,
    }))
}
else if (action === 'inventory' || action === 'validate') {
    const databases = check(admin.runCommand({
        listDatabases: 1,
        nameOnly: true,
    })).databases
    const inventory = []
    let checked = 0
    for (const entry of databases) {
        const database = db.getSiblingDB(entry.name)
        if (action === 'inventory' && ['config', 'local'].includes(entry.name)) continue
        const collections = database.getCollectionInfos().sort((first, second) => first.name.localeCompare(second.name))
        for (const collection of collections) {
            if (action === 'validate') {
                if (collection.type !== 'collection') continue
                const validation = check(database.runCommand({
                    validate: collection.name,
                    full: true,
                }))
                if (validation.valid !== true) throw new Error('invalidCollection')
                checked++
                continue
            }
            const indexes = collection.type === 'collection'
                ?
                database.getCollection(collection.name).getIndexes()
                :
                []
            const item = {
                collection: collection.name,
                count: collection.type === 'collection' && collection.name !== 'system.views'
                    ?
                    database.getCollection(collection.name).countDocuments({})
                    :
                    null,
                database: entry.name,
                indexes: indexes.sort((first, second) => first.name.localeCompare(second.name)).map(normalizeIndex),
                options: collection.options,
                type: collection.type,
            }
            if (entry.name === 'admin' && collection.name === 'system.version') continue
            inventory.push(item)
        }
    }
    inventory.sort((first, second) => `${first.database}/${first.collection}`.localeCompare(`${second.database}/${second.collection}`))
    output = action === 'validate'
        ?
        { checked }
        :
        inventory
}
else throw new Error('invalidUpgradeAction')
print(JSON.stringify(output))
