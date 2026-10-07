#!/usr/bin/env bash

forEachDeploymentUser() {
    local action="$1"
    local homeDir
    local shell
    local user
    local userId

    while IFS=: read -r user _ userId _ _ homeDir shell; do
        if [[ "$userId" -ge 1000 && "$homeDir" == /home/* && "$shell" != */nologin && "$shell" != */false ]]; then
            "$action" "$user"
        fi
    done < /etc/passwd
}
