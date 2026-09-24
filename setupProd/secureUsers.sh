#!/usr/bin/env bash
set -euo pipefail

. "$scripts/logger.sh"

secureUser() {
    local homeDir="$2"
    local user="$1"

    usermod -aG shared,www-data "$user"
    passwd -d "$user" >/dev/null
    rm -f "/etc/sudoers.d/$user"

    if getent group sudo >/dev/null; then
        gpasswd -d "$user" sudo >/dev/null 2>&1 || true
    fi
    if getent group admin >/dev/null; then
        gpasswd -d "$user" admin >/dev/null 2>&1 || true
    fi

    chmod 0711 "$homeDir"
    mkdir -p "$homeDir/.ssh"
    touch "$homeDir/.ssh/authorized_keys"
    chown -R "$user:$user" "$homeDir/.ssh"
    chmod 0700 "$homeDir/.ssh"
    chmod 0600 "$homeDir/.ssh/authorized_keys"

    success "Secured $user"
}

groupadd -f shared

while IFS=: read -r user _ _ _ _ homeDir _; do
    if [[ "$homeDir" == /home/* ]] && [[ -d "$homeDir" ]]; then
        secureUser "$user" "$homeDir"
    fi
done < /etc/passwd
