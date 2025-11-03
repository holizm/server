#!/bin/bash

groupadd -f shared

USERS_FILE="/gesth/users"

if [[ ! -f "$USERS_FILE" ]]; then
    echo "Error: User file '$USERS_FILE' not found!"
    exit 1
fi

while IFS= read -r user; do
    if [[ "$user" =~ ^[[:space:]] || "$user" =~ [[:space:]]$ ]]; then
        echo "Error: username '$user' has leading or trailing whitespace"
        continue
    fi
    if id "$user" >/dev/null 2>&1; then
    else
        sudo useradd -m -s /bin/bash -p "$(openssl passwd -6 'qD3jCRGAtQcaaLxasbPE')" "$user"
        sudo passwd --expire "$user"
    fi
    sudo usermod -aG shared "$user"
done < "$USERS_FILE"
