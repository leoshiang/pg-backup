const path = require('path')
const moment = require('moment')
const BackupAction = require('./BackupAction')

/**
 * 每日備份
 * @class
 */
class DailyBackupAction extends BackupAction {
    constructor (iConfig) {
        super(iConfig)
    }

    /**
     * 取得備份目錄。
     * @private
     * @return {string}
     */
    _getBackupDirectory () {
        return this._config.dailyBackupDir
    }

    /**
     * 取得輸出檔案名稱。
     * @param {string} dbName 資料庫名稱。
     * @protected
     * @returns {string}
     */
    _getOutputFileName (dbName) {
        return this._config.dailyBackupDir + path.sep
            + moment().format('YYYYMMDD') + '-'
            + dbName
            + (this._config.compressOutputFile ? '.dump' : '.sql')
    }

    /**
     * 取得備份檔案保留起始日期
     * @protected
     * @return {moment.Moment}
     */
    _getRetentionStartDate () {
        const today = new moment()
        const retentionPeriod = this._config.dailyBackupRetentionPeriod
        return today.subtract(retentionPeriod, 'days')
    }

    /**
     * 檔案是否為舊的?
     * @param {string} fileName 檔案名稱。
     * @param {moment.Moment} retentionStartDate 備份保留起始日期。
     * @protected
     * @return {boolean}
     */
    _isOldBackupFile (fileName, retentionStartDate) {
        const regex = new RegExp('^(\\d{4}\\d{2}\\d{2})-.*')
        const match = regex.exec(fileName)
        if (!match) return false
        const backupDate = moment(match[1])
        return backupDate.isBefore(retentionStartDate)
    }

    /**
     * 檢查保留期間是否有效。
     * @private
     * @return {boolean}
     */
    _isRetentionPeriodValid () {
        if (isNaN(this._config.dailyBackupRetentionPeriod)) return false
        return this._config.dailyBackupRetentionPeriod > 0
    }
}

module.exports = DailyBackupAction