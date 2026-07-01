#!/usr/bin/env bash
set -euo pipefail

. "$scripts/logger.sh"

groupadd -f shared

usersFile="/holism/users"
keysDir="/holism/keys"

[[ -f "$usersFile" ]] || errorAndExit "User file '$usersFile' not found"
[[ -d "$keysDir" ]] || errorAndExit "Keys directory '$keysDir' not found"

checkUser() {
    local user="$1"

    [[ "$user" != "root" ]] || return 1
    [[ ${#user} -eq 20 ]] || return 1
    [[ "$user" =~ ^[a-z]{3}[a-z0-9]{17}$ ]] || return 1

    return 0
}

while IFS= read -r rawUser || [[ -n "$rawUser" ]]; do
    user="$(echo "$rawUser" | xargs)"
    [[ -n "$user" ]] || continue

    if ! checkUser "$user"; then
        warning "Skipping invalid username '$user'. Rules: exactly 20 chars, first 3 letters [a-z], remaining 17 letters or digits [a-z0-9], cannot be 'root'"
        continue
    fi

    if ! id "$user" >/dev/null 2>&1; then
        useradd -m -s /bin/bash "$user"
    fi

    usermod -G shared "$user"
    passwd -d "$user" >/dev/null 2>&1 || true

    [[ -f /etc/sudoers.d/$user ]] && rm -f /etc/sudoers.d/$user

    pubKey="$keysDir/$user.pub"

    if [[ -f "$pubKey" ]]; then
        homeDir="$(getent passwd "$user" | cut -d: -f6)"
        chmod o+x $homeDir
        mkdir -p "$homeDir/.ssh"
        # cp "$pubKey" "$homeDir/.ssh/authorized_keys"
        chown -R "$user:$user" "$homeDir/.ssh"
        chmod 700 "$homeDir/.ssh"
        chmod 600 "$homeDir/.ssh/authorized_keys"
    else
        warning "No public key for '$user' at '$pubKey'"
    fi

done < "$usersFile"
