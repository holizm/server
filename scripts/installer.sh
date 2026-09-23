#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/logger.sh"

install() {
    local cmd_name="$1"
    local pkg_or_func="${2:-}"
    if command -v "$cmd_name" &>/dev/null; then
        success "$cmd_name $checkMark"
        return
    fi
    info "installing $cmd_name ..."
    if [[ -n "$pkg_or_func" ]]; then
        if declare -f "$pkg_or_func" &>/dev/null; then
            "$pkg_or_func" || errorAndExit "failed to install $cmd_name"
        else
            apt-get install -y "$pkg_or_func" || errorAndExit "failed to install $cmd_name"
        fi
    else
        apt-get install -y "$cmd_name" || errorAndExit "failed to install $cmd_name"
    fi
    success "installed $cmd_name"
}

ensureLatestLts() {
    local commandName="$1"
    local installedVersionProvider="$2"
    local latestVersionProvider="$3"
    local installerName="$4"
    local installedVersion
    local latestVersion
    local updatedVersion

    installedVersion=$("$installedVersionProvider")
    latestVersion=$("$latestVersionProvider")

    if [[ -z "$latestVersion" ]]; then
        errorAndExit "failed to resolve the latest $commandName LTS version"
    fi

    if [[ "$installedVersion" == "$latestVersion" ]]; then
        success "$commandName $installedVersion is the latest LTS $checkMark"
        return
    fi

    if [[ -n "$installedVersion" ]]; then
        info "updating $commandName from $installedVersion to LTS $latestVersion ..."
    else
        info "installing $commandName LTS $latestVersion ..."
    fi

    "$installerName" || errorAndExit "failed to install $commandName LTS $latestVersion"
    updatedVersion=$("$installedVersionProvider")

    if [[ "$updatedVersion" != "$latestVersion" ]]; then
        errorAndExit "$commandName LTS $latestVersion was requested, but $updatedVersion is installed"
    fi

    success "installed $commandName LTS $updatedVersion"
}
