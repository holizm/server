import formatBackupDate from './formatBackupDate.js'

export default date => formatBackupDate(date) + '_' + [
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
].map(value => String(value).padStart(2, '0')).join('-')
