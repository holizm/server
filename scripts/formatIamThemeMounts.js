export default mounts => mounts
    .map(({ name, source }) => `            - ${source}:/opt/keycloak/themes/${name}:ro`)
    .join('\n')
