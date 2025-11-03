#!/bin/bash
set -e

BASE="/gesth"
GROUP="shared"

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
