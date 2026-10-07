const validDomain = value => /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(value)
const validTenant = value => /^[a-z][a-zA-Z0-9]*$/.test(value)

export default tenants => {
    const domains = new Set()
    const lines = tenants.map(tenant => {
        const {
            domain,
            id,
        } = tenant
        if (!validDomain(domain) || !validTenant(id)) {
            throw new Error('Invalid tenant storage mapping')
        }
        if (domains.has(domain)) {
            throw new Error('Duplicate tenant domain')
        }
        domains.add(domain)
        return `storage.${domain} ${id}`
    })
    return lines.sort().join('\n')
}
