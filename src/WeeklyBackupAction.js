const path = require('path')
const moment = require('moment')
const BackupAction = require('./BackupAction')

/**
 * 每週備份
 * @class
 */
class WeeklyBackupAction extends BackupAction {
    constructor (iConfig) {
        super(iConfig)
    }

    /**
     * 取得備份目錄。
     * @private
     * @return {string}
     */
    _getBackupDirectory () {
        return this._config.weeklyBackupDir
    }

    /**
     * 取得輸出檔案名稱。
     * @param {string} dbName 資料庫名稱。
     * @protected
     * @returns {string}
     */
    _getOutputFileName (dbName) {
        const today = new moment()
        const year = today.isoWeekYear()
        const weekNumber = today.isoWeek()
        return this._config.weeklyBackupDir + path.sep
            + `week-${year}-${weekNumber}-`
            + dbName
            + (this._config.compressOutputFile ? '.dump' : '.sql')
    }

    /**
     * 取得備份檔案保留起始日期
     * @private
     * @return {moment.Moment}
     */
    _getRetentionStartDate () {
        const today = new moment()
        const retentionPeriod = this._config.weeklyBackupRetentionPeriod
        return today.subtract(retentionPeriod, 'weeks')
    }

    /**
     * 檔案是否為舊的?
     * @param {string} fileName 檔案名稱。
     * @param {moment.Moment} retentionStartDate 備份保留起始日期。
     * @protected
     * @return {boolean}
     */
    _isOldBackupFile (fileName, retentionStartDate) {
        const regex = new RegExp('^week-(\\d+)-(\\d+)-.*')
        const match = regex.exec(fileName)
        if (!match) return false
        const backupYear = parseInt(match[1], 10)
        const backupWeekNumber = parseInt(match[2], 10)
        if (isNaN(backupYear) || isNaN(backupWeekNumber)) return false

        const backupMoment = moment().isoWeekYear(backupYear).isoWeek(backupWeekNumber).startOf('isoWeek')
        return backupMoment.isBefore(moment(retentionStartDate).startOf('isoWeek'))
    }

    /**
     * 檢查保留期間是否有效。
     * @private
     * @return {boolean}
     */
    _isRetentionPeriodValid () {
        if (isNaN(this._config.weeklyBackupRetentionPeriod)) return false
        return this._config.weeklyBackupRetentionPeriod > 0
    }
}

module.exports = WeeklyBackupAction