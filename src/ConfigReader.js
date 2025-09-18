const { readFileSync } = require('fs')
const { parse } = require('ini')
const Config = require('./Config')
const path = require('path')
const { strToInt } = require('./Utils')

class ConfigReader {
    readFromFile (filePath) {
        let text = readFileSync(filePath, { encoding: 'utf-8' })
        const config = parse(text)
        const result = new Config()
        const backupDir = path.normalize((config.Backup && config.Backup.BACKUP_DIR) || '')

        result.afterBackupMessage = (config.Messaging && config.Messaging.AFTER_BACKUP_MESSAGE) || ''
        result.afterBackupScript = (config.Script && config.Script.AFTER_BACKUP_SCRIPT) || ''
        result.backupDirectory = backupDir
        result.beforeBackupMessage = (config.Messaging && config.Messaging.BEFORE_BACKUP_MESSAGE) || ''
        result.beforeBackupScript = (config.Script && config.Script.BEFORE_BACKUP_SCRIPT) || ''
        result.compressOutputFile = ((config.Backup && config.Backup.COMPRESS_OUTPUT_FILE) || '').toLowerCase() === 'yes'

        result.dbBackupList = (config.Backup && config.Backup.DB_BACKUP_LIST) || ''
        result.dbExcludeList = (config.Backup && config.Backup.DB_EXCLUDE_LIST) || ''
        result.dbHost = (config.Database && config.Database.DB_HOST) || ''
        result.dbName = (config.Database && config.Database.DB_NAME) || ''
        result.dbPassword = (config.Database && config.Database.DB_PASSWORD) || ''
        result.dbPort = (config.Database && config.Database.DB_PORT) || 5432
        result.dbUserName = (config.Database && config.Database.DB_USERNAME) || ''

        result.dailyBackupDir = path.join(result.backupDirectory, 'daily')
        result.dailyBackupRetentionPeriod = strToInt((config.Backup && config.Backup.DAILY_BACKUP_RETENTION_PERIOD) || '0')

        result.weeklyBackupAt = strToInt((config.Backup && config.Backup.WEEKLY_BACKUP_AT) || '')
        result.weeklyBackupDir = path.join(result.backupDirectory, 'weekly')
        result.weeklyBackupRetentionPeriod = strToInt((config.Backup && config.Backup.WEEKLY_BACKUP_RETENTION_PERIOD) || '')

        result.monthlyBackupAt = strToInt((config.Backup && config.Backup.MONTHLY_BACKUP_AT) || '')
        result.monthlyBackupDir = path.join(result.backupDirectory, 'monthly')
        result.monthlyBackupRetentionPeriod = strToInt((config.Backup && config.Backup.MONTHLY_BACKUP_RETENTION_PERIOD) || '')

        result.telegramToken = (config.Messaging && config.Messaging.TG_TOKEN) || ''
        result.telegramChatId = (config.Messaging && config.Messaging.TG_CHAT_ID) || null
        result.successEmoji = (config.Messaging && config.Messaging.SUCCESS_EMOJI) || '💚'
        result.errorEmoji = (config.Messaging && config.Messaging.ERROR_EMOJI) || '💔'
        return result
    }
}

module.exports = ConfigReader