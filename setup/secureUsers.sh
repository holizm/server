#!/bin/bash

sudo groupadd -f shared

USERS_FILE="/gesht/users"
KEYS_DIR="/gesht/keys"

if [[ ! -f "$USERS_FILE" ]]; then
    echo "Error: User file '$USERS_FILE' not found!"
    exit 1
fi

if [[ ! -d "$KEYS_DIR" ]]; then
    echo "Error: Keys directory '$KEYS_DIR' not found!"
    exit 1
fi

checkUser() {
    local user="$1"
    if [[ "$user" == "root" ]]; then
        echo "Error: username '$user' is not allowed (reserved name)"
        return 1
    fi
    if [[ ! "$user" =~ ^[a-z0-9]+$ ]]; then
        echo "Error: username '$user' must contain only lowercase letters (a–z)"
        return 1
    fi
    return 0
}

while IFS= read -r user; do
    if [[ "$user" =~ ^[[:space:]] || "$user" =~ [[:space:]]$ ]]; then
        echo "Error: username '$user' has leading or trailing whitespace"
        continue
    fi

    if ! checkUser "$user"; then
        continue
    fi

    if ! id "$user" >/dev/null 2>&1; then
        sudo useradd -m -s /bin/bash "$user"
    fi
    sudo usermod -aG shared "$user"

    PUBKEY="$KEYS_DIR/$user.pub"
    if [[ -f "$PUBKEY" ]]; then
        sudo mkdir -p "/home/$user/.ssh"
        sudo cp "$PUBKEY" "/home/$user/.ssh/authorized_keys"
        sudo chown -R "$user:$user" "/home/$user/.ssh"
        sudo chmod 700 "/home/$user/.ssh"
        sudo chmod 600 "/home/$user/.ssh/authorized_keys"
    else
        echo "Warning: No public key for '$user' at '$PUBKEY'"
    fi

done < "$USERS_FILE"
