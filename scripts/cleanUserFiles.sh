#!/usr/bin/env bash
set -euo pipefail

scriptDirectory=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
. "$scriptDirectory/cleanDocker.sh"

userHome=$1
cd -- "$userHome"
status=0
npmDirectory="$userHome/.npm"
if [[ -d $npmDirectory && ! -L $npmDirectory ]]; then
    if [[ -d $npmDirectory/_cacache && ! -L $npmDirectory/_cacache ]] && command -v npm >/dev/null; then
        if pgrep -u "$(id -u)" -f '(^|/|[[:space:]])npm([[:space:]]|$)' >/dev/null; then
            printf '%s\n' 'Skipped npm cache while npm is running.'
        elif ! npm cache clean --force --cache "$npmDirectory"; then
            status=1
        fi
    fi
    if [[ -d $npmDirectory/_logs && ! -L $npmDirectory/_logs ]]; then
        find "$npmDirectory/_logs" -xdev -maxdepth 1 -type f -name '*.log' -mtime +14 -delete || status=1
    fi
fi

logsDirectory="$userHome/.pm2/logs"
if [[ -d $logsDirectory && ! -L $userHome/.pm2 && ! -L $logsDirectory ]]; then
    if rotatedLogs=$(find "$logsDirectory" -xdev -maxdepth 1 -type f \
        \( -name '*.log.*' -o -name '*__[0-9][0-9][0-9][0-9]-*.log*' \) -delete -printf '.'); then
        printf 'Removed %s rotated PM2 log files.\n' "${#rotatedLogs}"
    else
        status=1
    fi
    if currentLogs=$(find "$logsDirectory" -xdev -maxdepth 1 -type f -name '*.log' -size +0c \
        -printf '.' -exec truncate --no-create --size 0 -- {} +); then
        printf 'Flushed %s PM2 log files.\n' "${#currentLogs}"
    else
        status=1
    fi
fi

cleanDocker "/run/user/$(id -u)/docker.sock" || status=1

exit "$status"
