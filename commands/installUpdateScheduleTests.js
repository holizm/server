import assert from 'assert/strict'
import test from 'node:test'
import { getContent } from '../scripts/os.js'

test('runtime maintenance runs as administrator for the explicit deployment account', () => {
    const schedule = getContent(new URL('./installUpdateSchedule', import.meta.url))
    assert.match(schedule, /0 0 \* \* 0 root .*updateServerRuntime \$userName/)
    assert.match(schedule, /0 1 \* \* 0 \$userName .*updateServerImages/)
})
