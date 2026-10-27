import formatBackupDate from './formatBackupDate.js'

export default date => {
    const minutes = -date.getTimezoneOffset()
    const sign = minutes >= 0 ? '+' : '-'
    const absoluteMinutes = Math.abs(minutes)
    const pad = value => String(value).padStart(2, '0')
    const time = [date.getHours(), date.getMinutes(), date.getSeconds()].map(pad).join(':')
    const offset = sign + pad(Math.floor(absoluteMinutes / 60)) + ':' + pad(absoluteMinutes % 60)
    return formatBackupDate(date) + 'T' + time + offset
}
