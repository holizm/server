import { readFileSync } from 'fs'
import { createRequire } from 'module'
import path from 'path'

export default async instancePath => {
    const require = createRequire(path.join(instancePath, 'adminApi', 'package.json'))
    const { MongoClient } = require('mongodb')
    const { database } = JSON.parse(readFileSync(path.join(instancePath, 'common', 'privateSettings.json'), 'utf8'))
    const client = new MongoClient('mongodb://127.0.0.1:' + database.port + '/?directConnection=true&authSource=admin', {
        auth: {
            password: database.password,
            username: database.user,
        },
        serverSelectionTimeoutMS: 10000,
    })
    try {
        await client.connect()
        const names = (await client.db('admin').admin().listDatabases({ nameOnly: true })).databases
            .map(database => database.name)
            .filter(name => !['admin', 'config', 'local'].includes(name)).sort()
        const state = []
        for (const name of names) {
            const stats = await client.db(name).command({ dbStats: 1 })
            state.push({
                collections: stats.collections,
                database: name,
                records: stats.objects,
            })
        }
        return state
    }
    finally {
        await client.close()
    }
}
