import fs from 'fs'
import os from 'os'
import path from 'path'

export default () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'runtimeUpdateTest'))
    const userHome = path.join(directory, 'home')
    fs.mkdirSync(path.join(userHome, '.pm2'), { recursive: true })
    fs.writeFileSync(path.join(userHome, '.pm2/pm2.pid'), '123')
    const writeCommand = (name, content) => fs.writeFileSync(path.join(directory, name), `#!/bin/bash\n${content}\n`, { mode: 0o755 })
    writeCommand('id', 'if [[ $1 == -u ]]; then echo 0; else echo dev; fi')
    writeCommand('getent', 'printf "ownerabcdefghijklmno:x:1:1::%s:/bin/bash\\n" "$runtimeTestHome"')
    writeCommand('runuser', 'shift 3\nexec "$@"')
    writeCommand('install', 'cp -- "${@: -2:1}" "${@: -1}"')
    writeCommand('timeout', 'while [[ $1 == --* ]]; do shift; done\nshift\nexec "$@"')
    writeCommand('sleep', ':')
    writeCommand('ss', 'echo "LISTEN 0 128 127.0.0.1:4000 0.0.0.0:* users:((node,pid=123,fd=1))"')
    writeCommand('pm2', `[[ $PWD == "$runtimeTestHome" ]] || exit 126
printf 'pm2 %s\\n' "$*" >> "$runtimeTestCalls"
case $1 in
    jlist) if [[ \${runtimeTestScenario:-} == empty || \${runtimeTestScenario:-} == partialRecovery && $(cat "$runtimeTestCount" 2>/dev/null) == 1 ]]; then echo '[]'; else cat "$runtimeTestBaseline"; fi ;;
    save) cp "$runtimeTestBaseline" "$HOME/.pm2/dump.pm2" ;;
esac`)
    writeCommand('systemctl', `printf 'systemctl %s\\n' "$*" >> "$runtimeTestCalls"
if [[ $1 == start ]]; then
    count=$(cat "$runtimeTestCount" 2>/dev/null || echo 0)
    count=$((count + 1))
    echo "$count" > "$runtimeTestCount"
    [[ \${runtimeTestScenario:-} != permanentFailure ]] || exit 1
    if [[ $count == 1 ]]; then
        [[ \${runtimeTestScenario:-} != interrupted ]] || kill -TERM "$PPID"
        [[ \${runtimeTestScenario:-} != startFailure ]] || exit 1
    fi
fi`)
    const baseline = [{
        name: 'site',
        pid: 123,
        pm2_env: { status: 'online' },
    }]
    const baselinePath = path.join(directory, 'baseline.json')
    fs.writeFileSync(baselinePath, JSON.stringify(baseline))
    const environment = {
        directory,
        env: {
            ...process.env,
            PATH: `${directory}${path.delimiter}${process.env.PATH}`,
            runtimeReadyTimeoutSeconds: '3',
            runtimeTestBaseline: baselinePath,
            runtimeTestCalls: path.join(directory, 'calls'),
            runtimeTestCount: path.join(directory, 'count'),
            runtimeTestHome: userHome,
        },
        snapshot: path.join(userHome, '.pm2/runtimeRecovery.json'),
    }
    return environment
}
