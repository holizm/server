#!/usr/bin/env node

import { runOnTerminal } from './terminal.js'

export default pid => {
    if (!pid) return ''
    const command = `ss -ltnpH | awk -v pid='${pid}' '$0 ~ "pid=" pid "," { address = $4; sub(/^.*:/, "", address); print address; exit }'`
    return runOnTerminal(command, false, true).trim()
}
