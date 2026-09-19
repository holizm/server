#!/usr/bin/env bash
set -euo pipefail

. "$scripts/logger.sh"
. "$scripts/createUser.sh"

usersFile="/holism/users"

[[ -f "$usersFile" ]] || errorAndExit "User file '$usersFile' not found"

while IFS= read -r rawUser || [[ -n "$rawUser" ]]; do
    user="$(echo "$rawUser" | xargs)"
    [[ -n "$user" ]] || continue

    if [[ ${#user} -ne 20 ]] || ! isValidUserPrefix "$user"; then
        warning "Skipping invalid username '$user'. Rules: exactly 20 chars, first 3 letters [a-z], remaining 17 letters or digits [a-z0-9], cannot be 'root'"
        continue
    fi

    createUser "$user" >/dev/null
done < "$usersFile"
