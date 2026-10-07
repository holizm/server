#!/usr/bin/env bash

configurePm2() {
    local homeDir
    local nodeDirectory
    local pm2Executable
    local serviceName
    local startupInstructions
    local user="$1"

    homeDir=$(getent passwd "$user" | cut -d: -f6)
    serviceName="pm2-$user.service"
    if systemctl is-enabled --quiet "$serviceName"; then
        return
    fi
    nodeDirectory=$(dirname "$(readlink -f "$(command -v node)")")
    pm2Executable=$(command -v pm2)
    if ! startupInstructions=$(runuser --user "$user" -- env HOME="$homeDir" LOGNAME="$user" USER="$user" PATH="$nodeDirectory:$PATH" "$pm2Executable" startup systemd 2>&1); then
        if [[ "$startupInstructions" != *'To setup the Startup Script'* ]]; then
            printf '%s\n' "$startupInstructions" >&2
            return 1
        fi
    fi
    env PATH="$nodeDirectory:$PATH" "$pm2Executable" startup systemd -u "$user" --hp "$homeDir"
    systemctl is-enabled --quiet "$serviceName"
}
