const PGDump = require('./PGDump')
const Utils = require('./Utils')
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')
const MessageService = require('./MessageService/MessageService')
class BackupAction {

    /**
     *
     * @param {Config} config
     */
    constructor (config) {
        /**
         * 備份設定。
         * @type {Config}
         * @protected
         */
        this._config = config

        /**
         * 要備份的資料庫名稱列表。
         * @type {null|string[]}
         * @protected
         */
        this._dbBackupList = null
    }

    /**
     * 執行備份之後。
     * @protected
     * @return {void}
     */
    _afterExecute () {
    }

    /**
     * 執行備份前。
     * @protected
     * @return {void}
     */
    _beforeExecute () {
    }

    /**
     * 建立資料庫連線物件。
     * @protected
     * @returns {Client}
     */
    _createClient () {
        return new Client({
            user: this._config.dbUserName,
            host: this._config.dbHost,
            database: this._config.dbName,
            password: this._config.dbPassword,
            port: this._config.dbPort,
        })
    }

    /**
     * 取得資料庫備份清單。
     * 如果沒有在設定檔的 DB_BACKUP_LIST 設定，就用全部的資料庫取代。
     * @protected
     * @returns {Promise<void>}
     */
    async _createDbBackupList () {
        this._dbBackupList = this._config.dbBackupList === '' ? await this._getDbNameList() : this._parseDbBackupList()
        const excludeList = await this._getDbExcludeList()
        this._dbBackupList = this._dbBackupList.filter(x => !excludeList.includes(x))
    }

    /**
     * 刪除檔案。
     * @param {string} filePath 完整檔案名稱。
     * @private
     */
    _deleteFile (filePath) {
        try {
            fs.unlinkSync(filePath)
        } catch (err) {
            MessageService.sendMessage(err)
        }
    }

    /**
     * 刪除舊的備份檔案。
     * @param {string} fileName 檔案名稱。
     * @protected
     * @return {void}
     */
    _deleteOldBackupFile (fileName) {
        MessageService.sendMessage(`刪除舊的備份檔案 ${fileName}。`)
        const filePath = this._getBackupDirectory() + path.sep + fileName
        this._deleteFile(filePath)
    }

    /**
     * 刪除舊的備份檔。
     * @protected
     * @return {void}
     */
    _deleteOldBackups () {
        if (!this._isRetentionPeriodValid()) return
        const dir = this._getBackupDirectory()
        if (!fs.existsSync(dir)) return
        const retentionStartDate = this._getRetentionStartDate()
        let files = fs.readdirSync(dir)
        let oldBackupFiles = files.filter(x => this._isOldBackupFile(x, retentionStartDate))
        oldBackupFiles.forEach(x => this._deleteOldBackupFile(x))
    }

    /**
     * 執行備份。
     * @protected
     * @return {void}
     */
    _doBackup () {
        this._ensureDirectory()
        for (let i = 0; i < this._dbBackupList.length; i++) {
            const dbName = this._dbBackupList[i]
            const outputFileName = this._getOutputFileName(dbName)
            MessageService.sendMessage(`正在備份資料庫 ${dbName}...`)
            const result = PGDump.export(this._config, dbName, outputFileName)
            if (!result) {
                MessageService.sendMessage(this._config.errorEmoji + `備份資料庫 ${dbName} 失敗。`)
                continue
            }
            MessageService.sendMessage(this._config.successEmoji + `資料庫 ${dbName} 已備份到 ${outputFileName}。`)
        }
    }

    /**
     * 確保備份目錄存在，不存在就建立。
     */
    _ensureDirectory () {
        const backupDirectory = this._getBackupDirectory()
        try {
            if (!fs.existsSync(backupDirectory)) {
                MessageService.sendMessage(`目錄 ${backupDirectory} 不存在，嘗試建立...`)
                fs.mkdirSync(backupDirectory, { recursive: true })
                MessageService.sendMessage(`已建立目錄 ${backupDirectory}。`)
            }
        } catch (err) {
            Utils.stopExecution(`建立 ${backupDirectory} 時發生錯誤：${err}`)
        }
    }

    /**
     * 取得備份目錄。
     * @protected
     * @return {string}
     */
    _getBackupDirectory () {
        throw new Error('請在子類別中實作此方法。')
    }

    /**
     * 取得不備份的資料庫名稱列表
     * @returns {Promise<string[]>}
     * @protected
     */
    async _getDbExcludeList () {
        return this._config.dbExcludeList.split(',')
            .map(x => x.trim())
            .filter(x => x !== '')
    }

    /**
     * 取得資料庫名稱列表。
     * @protected
     * @returns {Promise<*[string]>}
     */
    async _getDbNameList () {
        let dbNameList
        const client = this._createClient()
        try {
            await client.connect()
            const result = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false;')
            dbNameList = result.rows.map(x => x.datname)
        } catch (error) {
            MessageService.sendMessage(error)
            process.exit(1)
        } finally {
            try { await client.end() } catch (_) {}
        }
        return dbNameList
    }

    /**
     * 取得輸出檔案名稱
     * @param {string} dbName 資料庫名稱
     * @returns {string}
     * @protected
     */
    _getOutputFileName (dbName) {
        throw new Error('請在子類別中實作此方法。')
    }

    /**
     * 取得備份檔案保留起始日期
     * @protected
     * @return {moment.Moment}
     */
    _getRetentionStartDate () {
        throw new Error('請在子類別中實作此方法。')
    }

    /**
     * 檔案是否為舊的?
     * @param {string} fileName 檔案名稱。
     * @param {moment.Moment} retentionStartDate 備份保留起始日期。
     * @protected
     * @return {boolean}
     */
    _isOldBackupFile (fileName, retentionStartDate) {
        throw new Error('請在子類別中實作此方法。')
    }

    /**
     * 檢查保留期間是否有效。
     * @private
     * @return {boolean}
     */
    _isRetentionPeriodValid() {
        throw new Error('Method not implemented.')
    }

    /**
     * 解析設定檔的 DB_BACKUP_LIST 以取得資料庫備份清單。
     * @return {string[]}
     * @protected
     */
    _parseDbBackupList () {
        return this._config.dbBackupList.split(',')
            .map(x => x.trim())
            .filter(x => x !== '')
    }

    /**
     * 執行備份。
     * @returns {Promise<boolean>}
     */
    async execute () {
        try {
            this._beforeExecute()
            await this._createDbBackupList()
            this._doBackup()
            this._deleteOldBackups()
            this._afterExecute()
            return true
        } catch(error) {
            this._afterExecute()
            return false
        }
    }
}

module.exports = BackupAction