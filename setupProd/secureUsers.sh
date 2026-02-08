#!/bin/bash

. "$scripts/logger.sh"

sudo groupadd -f shared

usersFile="/holism/users"
keysDir="/holism/keys"

if [[ ! -f "$usersFile" ]]; then
    errorAndExit "Error: User file '$usersFile' not found!"
fi

if [[ ! -d "$keysDir" ]]; then
    errorAndExit "Error: Keys directory '$keysDir' not found!"
fi

checkUser() {
    local user="$1"

    if [[ "$user" == "root" ]]; then
        error "Error: username '$user' is not allowed (reserved name)"
        return 1
    fi

    if [[ ! "$user" =~ ^[a-z0-9]+$ ]]; then
        error "Error: username '$user' must contain only lowercase letters (a–z)"
        return 1
    fi

    return 0
}

while IFS= read -r user; do
    if [[ "$user" =~ ^[[:space:]] || "$user" =~ [[:space:]]$ ]]; then
        error "Error: username '$user' has leading or trailing whitespace"
        continue
    fi

    if ! checkUser "$user"; then
        continue
    fi

    if ! id "$user" >/dev/null 2>&1; then
        sudo useradd -m -s /bin/bash "$user"
    fi

    sudo usermod -aG shared "$user"
    sudo passwd -d "$user"

    pubKey="$keysDir/$user.pub"

    if [[ -f "$pubKey" ]]; then
        sudo mkdir -p "/home/$user/.ssh"
        sudo cp "$pubKey" "/home/$user/.ssh/authorized_keys"
        sudo chown -R "$user:$user" "/home/$user/.ssh"
        sudo chmod 700 "/home/$user/.ssh"
        sudo chmod 600 "/home/$user/.ssh/authorized_keys"
    else
        warning "Warning: No public key for '$user' at '$pubKey'"
    fi

done < "$usersFile"
