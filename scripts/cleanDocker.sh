cleanDocker() {
    local socket=$1
    [[ -S $socket && ! -L $socket ]] || return 0
    command -v docker >/dev/null || return 0

    local status=0
    local containerEngine=(env -u DOCKER_CONTEXT -u DOCKER_HOST docker --host "unix://$socket")
    printf '%s\n' 'Remove dangling container images and unused build cache older than seven days'
    "${containerEngine[@]}" image prune --force --filter until=168h || status=1
    "${containerEngine[@]}" builder prune --force --filter until=168h || status=1
    return "$status"
}
