#!/usr/bin/env bash

isValidUserPrefix() {
    local user="$1"

    [[ "$user" != 'root' ]] || return 1
    [[ ${#user} -le 20 ]] || return 1
    [[ "$user" =~ ^[a-z]{3}[a-z0-9]*$ ]] || return 1
}

completeUsername() {
    local characters='abcdefghijklmnopqrstuvwxyz0123456789'
    local randomNumber
    local user="$1"

    isValidUserPrefix "$user" || return 1

    while [[ ${#user} -lt 20 ]]; do
        randomNumber=$(od -An -N4 -tu4 /dev/urandom)
        user+="${characters:randomNumber%${#characters}:1}"
    done

    printf '%s\n' "$user"
}

createUser() {
    local homeDir
    local user

    user=$(completeUsername "$1") || return 1

    groupadd -f shared

    if ! id "$user" >/dev/null 2>&1; then
        useradd -m -s /bin/bash "$user"
    fi

    usermod -aG shared,www-data "$user"
    passwd -d "$user" >/dev/null 2>&1 || true

    [[ -f "/etc/sudoers.d/$user" ]] && rm -f "/etc/sudoers.d/$user"

    homeDir=$(getent passwd "$user" | cut -d: -f6)
    chmod o+x "$homeDir"
    mkdir -p "$homeDir/.ssh"
    touch "$homeDir/.ssh/authorized_keys"
    chown -R "$user:$user" "$homeDir/.ssh"
    chmod 700 "$homeDir/.ssh"
    chmod 600 "$homeDir/.ssh/authorized_keys"

    printf '%s\n' "$user"
}
