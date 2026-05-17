#!/bin/bash
set -e

base="/holism"
group="shared"
usersFile="$base/users"
keysDir="$base/keys"
cmdsDir="$base/server/commands"

for dir in "$base" "$base/users" "$base/keys" "$base/server" "$base/fonts"; do
    if [[ -d "$dir" ]]; then
        chown root:$group "$dir"
        chmod 2775 "$dir"
    fi
done

if [[ -d "$base/keys" ]]; then
    chown root:root "$base/keys"
    chmod 0750 "$base/keys"
fi

if [[ -f "$base/users" ]]; then
    chown root:root "$base/users"
    chmod 0640 "$base/users"
fi

if [[ -f "$usersFile" && -d "$keysDir" ]]; then
    while IFS= read -r user; do
        [[ -z "$user" ]] && continue
        if [[ "$user" =~ ^[[:space:]] || "$user" =~ [[:space:]]$ ]]; then
            continue
        fi
        if [[ ! "$user" =~ ^[a-z0-9]+$ ]]; then
            continue
        fi
        pub="$keysDir/$user.pub"
        if [[ ! -f "$pub" ]]; then
            touch "$pub"
            chown root:root "$pub"
            chmod 0640 "$pub"
        fi
    done < "$usersFile"
fi

if [[ -d "$cmdsDir" ]]; then
    mapfile -t files < <(find "$cmdsDir" -maxdepth 1 -type f)
    if (( ${#files[@]} )); then
        chmod 0755 "${files[@]}"
    fi
fi
