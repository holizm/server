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
