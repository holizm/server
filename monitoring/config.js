export const config = {
    cpuThresholdPercent: Number(process.env.cpuThresholdPercent || 85),
    diskCheckIntervalMilliseconds: Number(process.env.diskCheckIntervalSeconds || 86_400) * 1_000,
    diskMinimumFreeGigabytes: Number(process.env.diskMinimumFreeGigabytes || 3),
    diskPath: process.env.diskPath || '/',
    gigabyte: 1_000 ** 3,
    ramThresholdPercent: Number(process.env.ramThresholdPercent || 90),
    resourceAlertDurationMilliseconds: Number(process.env.resourceAlertDurationSeconds || 300) * 1_000,
    resourceCheckIntervalMilliseconds: Number(process.env.resourceCheckIntervalSeconds || 60) * 1_000,
    telegramBotToken: process.env.telegramBotToken,
    telegramChatId: process.env.telegramChatId,
}
