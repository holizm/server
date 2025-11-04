#!/bin/bash
set -e

BASE="/gesht"
GROUP="shared"
USERS_FILE="$BASE/users"
KEYS_DIR="$BASE/keys"
CMDS_DIR="$BASE/server/commands"

for dir in "$BASE" "$BASE/users" "$BASE/keys" "$BASE/server" "$BASE/fonts"; do
    if [[ -d "$dir" ]]; then
        sudo chown root:$GROUP "$dir"
        sudo chmod 2775 "$dir"
    fi
done

if [[ -d "$BASE/keys" ]]; then
    sudo chown root:root "$BASE/keys"
    sudo chmod 0750 "$BASE/keys"
fi

if [[ -f "$BASE/users" ]]; then
    sudo chown root:root "$BASE/users"
    sudo chmod 0640 "$BASE/users"
fi

if [[ -f "$USERS_FILE" && -d "$KEYS_DIR" ]]; then
    while IFS= read -r user; do
        [[ -z "$user" ]] && continue
        if [[ "$user" =~ ^[[:space:]] || "$user" =~ [[:space:]]$ ]]; then
            continue
        fi
        if [[ ! "$user" =~ ^[a-z0-9]+$ ]]; then
            continue
        fi
        PUB="$KEYS_DIR/$user.pub"
        if [[ ! -f "$PUB" ]]; then
            sudo touch "$PUB"
            sudo chown root:root "$PUB"
            sudo chmod 0640 "$PUB"
        fi
    done < "$USERS_FILE"
fi

if [[ -d "$CMDS_DIR" ]]; then
    mapfile -t files < <(find "$CMDS_DIR" -maxdepth 1 -type f)
    if (( ${#files[@]} )); then sudo chmod 0755 "${files[@]}"; fi
fi
