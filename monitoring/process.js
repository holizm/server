#!/usr/bin/env node

import { config } from './config.js'
import { cpu } from './cpu.js'
import { disk } from './disk.js'
import { notifier } from './notifier.js'
import { ram } from './ram.js'
import { resourceMonitor } from './resourceMonitor.js'
import { runner } from './runner.js'
import { sustainedUsage } from './sustainedUsage.js'

const monitor = resourceMonitor({
    config,
    cpu: cpu('/proc/stat'),
    disk: disk(config.diskPath),
    ram: ram('/proc/meminfo'),
    sustainedUsage: sustainedUsage(config.resourceAlertDurationMilliseconds),
})
const monitoringRunner = runner({
    config,
    notifier: notifier({
        botToken: config.telegramBotToken,
        chatId: config.telegramChatId,
    }),
    resourceMonitor: monitor,
})

monitoringRunner.start()
