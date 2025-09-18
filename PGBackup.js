(async () => {

    const fs = require('fs')
    const ConfigReader = require('./src/ConfigReader')
    const DailyBackupAction = require('./src/DailyBackupAction')
    const WeeklyBackupAction = require('./src/WeeklyBackupAction')
    const MonthlyBackupAction = require('./src/MonthlyBackupAction')
    const moment = require('moment')
    const MessageService = require('./src/MessageService/MessageService')
    const child_process = require('node:child_process')
    try { require('dotenv').config() } catch (_) {}

    const { program } = require('commander')
    program
        .argument('<iniFileName>', '設定檔檔案名稱(*.ini)。')
        .action(async function (jsonFileName, options) {
            await main(jsonFileName, options)
        })
        .parse(process.argv)

    async function main (iniFileName, options) {
        if (!fs.existsSync(iniFileName)) {
            console.error(`檔案 ${iniFileName} 不存在!`)
            process.exit(1)
        }

        const configReader = new ConfigReader()
        const config = configReader.readFromFile(iniFileName)
        MessageService._init(config)
        try {
            if (config.beforeBackupScript) {
                try {
                    child_process.execSync(config.beforeBackupScript, { stdio: 'inherit' })
                } catch (err) {
                    MessageService.sendMessage(config.errorEmoji + `前置腳本失敗：${err}`)
                    process.exit(1)
                }
            }
            if (config.beforeBackupMessage) {
                MessageService.sendMessage(config.beforeBackupMessage)
            }
            await doDailyBackup(config)
            await doWeeklyBackup(config)
            await doMonthlyBackup(config)
        } finally {
            if (config.afterBackupScript) {
                try {
                    child_process.execSync(config.afterBackupScript, { stdio: 'inherit' })
                } catch (err) {
                    MessageService.sendMessage(config.errorEmoji + `後置腳本失敗：${err}`)
                }
            }
            if (config.afterBackupMessage) {
                MessageService.sendMessage(config.afterBackupMessage)
            }
        }
    }

    async function doDailyBackup (config) {
        MessageService.sendMessage('執行每日備份...')
        return await new DailyBackupAction(config).execute()
    }

    async function doWeeklyBackup (config) {
        const dayOfWeek = moment().isoWeekday()
        if (dayOfWeek !== config.weeklyBackupAt) return
        MessageService.sendMessage('執行每週備份...')
        return await new WeeklyBackupAction(config).execute()
    }

    async function doMonthlyBackup (config) {
        const dateOfMonth = moment().date()
        if (dateOfMonth !== config.monthlyBackupAt) return
        MessageService.sendMessage('執行每月備份...')
        return await new MonthlyBackupAction(config).execute()
    }

})()