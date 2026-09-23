#!/usr/bin/env bash
set -euo pipefail

ensureSubordinateIdRange() {
    local end
    local file="$2"
    local option="$3"
    local start
    local user="$1"

    if awk -F: -v user="$user" '$1 == user { found = 1 } END { exit !found }' "$file"; then
        return
    fi
    start=$(awk -F: 'BEGIN { end = 99999 } { candidate = $2 + $3 - 1; if (candidate > end) end = candidate } END { print end + 1 }' "$file")
    end=$((start + 65535))
    usermod "$option" "$start-$end" "$user"
}

ensureSubordinateIds() {
    local user="$1"

    ensureSubordinateIdRange "$user" /etc/subuid --add-subuids
    ensureSubordinateIdRange "$user" /etc/subgid --add-subgids
}

runForUser() {
    local homeDir="$2"
    local user="$1"
    local userId="$3"
    shift 3
    runuser --user "$user" -- env \
        DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$userId/bus" \
        HOME="$homeDir" \
        LOGNAME="$user" \
        USER="$user" \
        XDG_RUNTIME_DIR="/run/user/$userId" \
        "$@"
}

configureRootlessDocker() {
    local homeDir
    local serviceFile
    local user="$1"
    local userId

    homeDir=$(getent passwd "$user" | cut -d: -f6)
    userId=$(id -u "$user")
    serviceFile="$homeDir/.config/systemd/user/docker.service"
    ensureSubordinateIds "$user"
    loginctl enable-linger "$user"
    systemctl start "user@$userId.service"
    if [[ ! -f "$serviceFile" ]]; then
        runForUser "$user" "$homeDir" "$userId" dockerd-rootless-setuptool.sh install
    fi
    runForUser "$user" "$homeDir" "$userId" systemctl --user daemon-reload
    runForUser "$user" "$homeDir" "$userId" systemctl --user enable --now docker.service
    if ! runForUser "$user" "$homeDir" "$userId" docker context inspect rootless >/dev/null 2>&1; then
        runForUser "$user" "$homeDir" "$userId" docker context create rootless --docker "host=unix:///run/user/$userId/docker.sock"
    fi
    runForUser "$user" "$homeDir" "$userId" docker context use rootless
    if ! runForUser "$user" "$homeDir" "$userId" docker info --format '{{json .SecurityOptions}}' | grep -q rootless; then
        printf 'Rootless Docker verification failed for %s.\n' "$user" >&2
        return 1
    fi
}
