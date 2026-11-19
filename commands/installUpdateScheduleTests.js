import assert from 'assert/strict'
import test from 'node:test'
import { getContent } from '../scripts/os.js'

test('runtime maintenance runs as administrator for the explicit deployment account', () => {
    const schedule = getContent(new URL('./installUpdateSchedule', import.meta.url))
    assert.match(schedule, /0 0 \* \* 0 root .*updateServerRuntime \$userName/)
    assert.match(schedule, /0 1 \* \* 0 \$userName .*updateServerImages/)
})

test('server setup installs nightly cleanup as root and sends its output to the system log', () => {
    const setup = getContent(new URL('../setupProd/setup', import.meta.url))
    const schedule = getContent(new URL('./installUpdateSchedule', import.meta.url))
    assert.match(setup, /^\/holism\/server\/commands\/installUpdateSchedule$/m)
    assert.match(schedule, /^cat > \/etc\/cron\.d\/holismCleanup <<'EOF'$/m)
    assert.match(schedule, /^30 3 \* \* \* root set -o pipefail; \/holism\/server\/commands\/clean 2>&1 \| \/usr\/bin\/logger -t holismClean$/m)
    assert.match(schedule, /^chmod 0644 \/etc\/cron\.d\/holismCleanup$/m)
})
