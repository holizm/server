#!/usr/bin/env bash
set -euo pipefail

normalizeShell() {
    local group="$3"
    local homeDir="$1"
    local user="$2"

    printf '%s\n' \
        'if [[ $- == *i* ]]; then' \
        "    PS1='\\u@\\h:\\w\\$ '" \
        'fi' \
        > "$homeDir/.bashrc"
    printf '%s\n' \
        'if [ -n "$BASH_VERSION" ]; then' \
        '    . "$HOME/.bashrc"' \
        'fi' \
        > "$homeDir/.profile"
    printf '%s\n' \
        'if [ -f "$HOME/.profile" ]; then' \
        '    . "$HOME/.profile"' \
        'fi' \
        > "$homeDir/.bash_profile"
    : > "$homeDir/.bash_logout"
    chown "$user:$group" \
        "$homeDir/.bash_logout" \
        "$homeDir/.bash_profile" \
        "$homeDir/.bashrc" \
        "$homeDir/.profile"
    chmod 0644 \
        "$homeDir/.bash_logout" \
        "$homeDir/.bash_profile" \
        "$homeDir/.bashrc" \
        "$homeDir/.profile"
}

normalizeShell /root root root
normalizeShell /etc/skel root root

while IFS=: read -r user _ _ groupId _ homeDir _; do
    if [[ "$homeDir" == /home/* ]] && [[ -d "$homeDir" ]]; then
        group=$(getent group "$groupId" | cut -d: -f1)
        normalizeShell "$homeDir" "$user" "$group"
    fi
done < /etc/passwd
