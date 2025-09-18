# PGBackup

這是一個備份 PostgreSQL 的小工具，支援 Windows/Linux/MacOS。

# 特色

- 可自訂每日、每週與每月備份時間與保留週期
- 可自訂備份目錄，程式會自動建立不存在的目錄
- 備份前/後可執行腳本並推送訊息
- 透過 Telegram 傳送通知
- 透過 pg_dump 進行備份，支援壓縮的 custom 格式

# 使用方式

## 建立 ini 檔案

使用文字編輯器建立 ini 檔案，假設檔名是 test.ini
```ini
[Script]
# 備份之後要執行的指令
AFTER_BACKUP_SCRIPT=
# 備份之前要執行的指令
BEFORE_BACKUP_SCRIPT=
[Messaging] SUCCESS_EMOJI = 💚 ERROR_EMOJI = 💔
# 備份之前要顯示的訊息
BEFORE_BACKUP_MESSAGE=備份[開發區、測試區]
# 備份之後要顯示的訊息
AFTER_BACKUP_MESSAGE=備份完成[開發區、測試區]
# Telegram 設定
TG_TOKEN= TG_CHAT_ID=

[Database]
# 資料庫主機，IP 或是名稱
DB_HOST=127.0.0.1
# 資料庫主機通訊埠
DB_PORT=5432
# 連線預設的資料庫（僅用於列出 DB 清單）
DB_NAME=postgres
# 資料庫使用者密碼
DB_PASSWORD=
# 資料庫使用者名稱
DB_USERNAME=postgres

[Backup]
# 備份資料夾（若不存在會自動建立）
BACKUP_DIR=C:\BackupFolder
# 是否壓縮備份檔案。
# yes -> 使用 pg_dump custom 格式（含壓縮），副檔名為 .dump
# 其他 -> 輸出純 .sql
COMPRESS_OUTPUT_FILE=yes
# 每日備份保留週期（天），7 代表保留 7 天內的備份
DAILY_BACKUP_RETENTION_PERIOD=7
# 要備份的資料庫名稱，以逗號分隔（留空代表全部非 template DB）
DB_BACKUP_LIST=test,test2,test3
# 不備份的資料庫名稱，以逗號分隔
DB_EXCLUDE_LIST=template1,postgres,test
# 在每月的幾號進行月備份（1 代表每月 1 號）
MONTHLY_BACKUP_AT=19
# 月備份保留週期（以月計），3 代表保留近 3 個月
MONTHLY_BACKUP_RETENTION_PERIOD=3
# 在星期幾進行週備份（1=星期一, 7=星期日；採用 ISO 週）
WEEKLY_BACKUP_AT=3
# 週備份保留週期（以週計），4 代表保留近 4 週
WEEKLY_BACKUP_RETENTION_PERIOD=4
```
## 執行程式

將執行檔與 test.ini 放在同一個目錄。

Windows
```bash
PGBackup test.ini
```
Linux
```bash
sudo ./PGBackup test.ini
```
# 注意事項

- 必須能在命令列執行 `pg_dump`（請確認已安裝並設定於 PATH）
- 若設定 COMPRESS_OUTPUT_FILE=yes，輸出為 `.dump`（pg_dump custom 格式，已內建壓縮）
- 若設定為其他值或留空，輸出為 `.sql`
- 保留週期會自動刪除舊備份檔（每日/每週/每月分別依據各自檔名格式與時間比較）
- 備份前/後腳本若執行失敗，預設會中止或記錄錯誤訊息（視情境而定）

# 開發

## 安裝建置執行檔時所需軟體

### pkg
```bash
npm install -g pkg
```
### VerMgr

1. 前往 VerMgr 下載最新的執行檔  
   https://github.com/leoshiang/VerMgr/releases
2. 在此 repo 建立 VerMgr 目錄
3. 將下載的 `vermgr-win-x64-x.x.x-PROD-YYYYMMDD.exe` 放在 VerMgr 目錄
4. 將其更名為 `vermgr.exe`

## 建置執行檔

（目前僅支援在 Windows 作業系統建置）
```bash
npm run build
```
輸出檔案會產生在 release 目錄裡面。

# 使用 Telegram 傳送訊息

## 下載檔案

請至 https://github.com/leoshiang/TGMsg/releases 下載 TGMsg 執行檔。

## 重新命名

- Windows：將下載檔案改名為 `TGMsg.exe`
- Linux：將下載檔案改名為 `TGMsg`
- 並將其所在位置加入環境變數 PATH

## Token 與 ChatId

在 Telegram 建立 Bot 和 Channel，記下 `TOKEN` 與 `CHAT_ID`。

## 修改 ini 檔案的 Messaging 區段

將 Telegram Bot 的 Token 寫在 `TG_TOKEN`。  
將 Telegram 的 Channel Id 寫在 `TG_CHAT_ID`。
```ini
[Messaging]
# Telegram 設定
TG_TOKEN= TG_CHAT_ID=