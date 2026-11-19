#!/usr/bin/env bash
set -euo pipefail

userHome=$1
status=0
npmDirectory="$userHome/.npm"
if [[ -d $npmDirectory && ! -L $npmDirectory ]]; then
    if [[ -d $npmDirectory/_cacache && ! -L $npmDirectory/_cacache ]] && command -v npm >/dev/null; then
        if pgrep -u "$(id -u)" -f '(^|/|[[:space:]])npm([[:space:]]|$)' >/dev/null; then
            printf '%s\n' 'Skipped npm cache while npm is running.'
        elif ! (cd -- "$userHome" && npm cache clean --force --cache "$npmDirectory"); then
            status=1
        fi
    fi
    if [[ -d $npmDirectory/_logs && ! -L $npmDirectory/_logs ]]; then
        find "$npmDirectory/_logs" -xdev -maxdepth 1 -type f -name '*.log' -mtime +14 -delete || status=1
    fi
fi

logsDirectory="$userHome/.pm2/logs"
if [[ -d $logsDirectory && ! -L $userHome/.pm2 && ! -L $logsDirectory ]]; then
    find "$logsDirectory" -xdev -maxdepth 1 -type f -mtime +14 \
        \( -name '*.log.*' -o -name '*__[0-9][0-9][0-9][0-9]-*.log*' \) -delete || status=1
    find "$logsDirectory" -xdev -maxdepth 1 -type f -name '*.log' -mtime +14 -size +0c \
        -exec truncate --no-create --size 0 -- {} + || status=1
fi

exit "$status"
