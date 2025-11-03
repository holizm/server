#!/bin/bash

groupadd -f shared

USERS_FILE="/gesth/users"

# Check if file exists
if [[ ! -f "$USERS_FILE" ]]; then
    echo "Error: User file '$USERS_FILE' not found!"
    exit 1
fi

while IFS= read -r user; do
    if [[ "$user" =~ ^[[:space:]] || "$user" =~ [[:space:]]$ ]]; then
        echo "Error: username '$user' has leading or trailing whitespace"
        continue
    fi
    id "$user" >/dev/null 2>&1 || sudo useradd -m -s /bin/bash "$user"
done < $USERS_FILE
