import formatBackupDate from './formatBackupDate.js'

export default now => {
    const dates = new Set()
    for (let days = 0; days <= 119; days++) {
        const date = new Date(now)
        date.setHours(0, 0, 0, 0)
        date.setDate(date.getDate() - days)
        if (days <= 29 || date.getDay() === 6) dates.add(formatBackupDate(date))
        if (days >= 30) dates.add(formatBackupDate(date).slice(0, 7) + '-01')
    }
    for (let months = 4; months <= 12; months++) {
        dates.add(formatBackupDate(new Date(now.getFullYear(), now.getMonth() - months, 1)))
    }
    return dates
}
