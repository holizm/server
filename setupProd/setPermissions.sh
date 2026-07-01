#!/bin/bash
set -e

base="/holism"
group="shared"
usersFile="$base/users"
cmdsDir="$base/server/commands"

for dir in "$base" "$base/users" "$base/server" "$base/fonts"; do
    if [[ -d "$dir" ]]; then
        chown root:$group "$dir"
        chmod 2775 "$dir"
    fi
done

if [[ -f "$base/users" ]]; then
    chown root:root "$base/users"
    chmod 0640 "$base/users"
fi

if [[ -d "$cmdsDir" ]]; then
    mapfile -t files < <(find "$cmdsDir" -maxdepth 1 -type f)
    if (( ${#files[@]} )); then
        chmod 0755 "${files[@]}"
    fi
fi
