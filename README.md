# Garmin inReach Gmail 監控系統

使用 Google Apps Script 自動監控 Garmin inReach 發送的郵件，解析訊息內容並寫入 Google Sheet，同時推送 Line 通知。

## 功能特色

- 🔍 自動搜尋 Gmail 中的 inReach 郵件
- 📝 解析寄件者名稱、訊息內容與 Garmin Explore 連結
- 📊 根據隊伍設定自動分類並寫入對應分頁
- 📱 透過 Line Messaging API 推送即時通知
- ⏰ 支援時間範圍設定，只處理活躍隊伍的訊息
- 🏷️ 使用 Gmail Label 避免重複處理

## 專案結構

```
inreach-gmail-line-monitor/
├── .clasp.json         # CLASP 配置（需自行建立，參考 .clasp.json.example）
├── .clasp.json.example # CLASP 配置範例
├── .gitignore          # Git 忽略檔案
├── appsscript.json     # Apps Script 設定
├── main.gs             # 主程式入口點
├── config.gs           # Config Sheet 讀取模組
├── gmail.gs            # Gmail 搜尋與標籤模組
├── parser.gs           # 郵件解析模組
├── sheet.gs            # Google Sheet 操作模組
├── line.gs             # Line Messaging API 推播模組
└── README.md           # 說明文件
```

## 安裝步驟

### 1. 安裝 CLASP

```bash
npm install -g @google/clasp
```

### 2. 登入 Google 帳號

```bash
clasp login
```

### 3. 建立 Google Apps Script 專案

```bash
clasp create --type standalone --title "inReach Gmail Monitor"
```

這會自動建立 `.clasp.json`。

### 4. 推送程式碼

```bash
clasp push
```

### 5. 開啟 Apps Script 編輯器

```bash
clasp open
```

## Google Sheet 設定

### 1. 建立試算表

建立一個名為 `inReach_monitor` 的 Google Sheet。

### 2. 建立 Config 分頁

在試算表中建立名為 `Config` 的分頁，欄位如下：

| 欄位 | 說明 | 範例 |
|------|------|------|
| id | 唯一識別碼 | 1 |
| inreach_name | inReach 裝置名稱（對應郵件 Subject） | 小明 |
| team_name | 隊伍名稱 | TeamA |
| start_time | 開始時間 | 2024-01-01 00:00:00 |
| end_time | 結束時間 | 2024-12-31 23:59:59 |
| active | 是否啟用 | TRUE |

範例：

| id | inreach_name | team_name | start_time | end_time | active |
|----|--------------|-----------|------------|----------|--------|
| 1 | 小明 | 登山A隊 | 2024-01-01 | 2024-12-31 | TRUE |
| 2 | 大華 | 登山B隊 | 2024-06-01 | 2024-06-30 | TRUE |

## Line Bot 設定

### 1. 建立 Line Bot

1. 到 [Line Developers Console](https://developers.line.biz/) 建立 Messaging API Channel
2. 取得 **Channel Access Token**

### 2. 取得 Group ID（若要推送到群組）

1. 開啟 [https://webhook.site](https://webhook.site) 取得臨時 Webhook URL
2. 在 Line Developers Console 設定此 URL 為 Webhook
3. 在 Line 群組中發送任意訊息
4. 在 webhook.site 查看收到的 JSON，找到 `source.groupId`
5. 複製 Group ID（以 `C` 開頭）

### 3. 設定 Script Properties

在 Apps Script 編輯器中：

1. 點擊「專案設定」（齒輪圖示）
2. 找到 Script Properties
3. 新增以下屬性：

| 屬性 | 說明 |
|------|------|
| `LINE_CHANNEL_ACCESS_TOKEN` | Line Bot 的 Channel Access Token |
| `LINE_USER_ID` | 推送目標的 User ID（以 `U` 開頭）或 Group ID（以 `C` 開頭） |

## 使用方式

### 手動執行

1. 開啟 Apps Script 編輯器
2. 選擇 `scanInreachMails` 函數
3. 點擊「執行」

### 設定自動執行

在 Apps Script 編輯器中執行 `setupTrigger` 函數，將會設定每 5 分鐘自動執行一次。

或者手動設定觸發器：

1. 點擊「觸發條件」圖示（時鐘圖示）
2. 新增觸發條件
3. 選擇函數：`scanInreachMails`
4. 選擇事件來源：時間驅動
5. 選擇時間型觸發條件類型：分鐘計時器
6. 選擇間隔：每 5 分鐘

## 測試函數

| 函數 | 說明 |
|------|------|
| `testShowConfigs()` | 顯示所有 Config 設定 |
| `testSearchEmails()` | 測試郵件搜尋 |
| `testLineNotification()` | 測試 Line 推播 |

## 輸出格式

### Google Sheet

系統會自動建立以日期和隊伍命名的分頁，格式為：`YYYYMMDD_隊伍名稱`

每個分頁包含以下欄位：

| 欄位 | 說明 |
|------|------|
| timestamp | 郵件時間戳記 |
| inreach_name | inReach 裝置名稱 |
| team_name | 隊伍名稱 |
| message_text | 訊息內容 |
| explore_link | Garmin Explore 連結 |
| gmail_message_id | Gmail 訊息 ID |

### Line 推播訊息

```
inReach：{裝置名稱}

Team：{隊伍名稱}

Time: {時間}

Message：
{訊息內容}

Link：
{Garmin Explore 連結}
```

## 權限需求

- Gmail（讀取郵件、管理標籤）
- Google Sheets（讀寫試算表）
- Google Drive（搜尋試算表）
- 外部請求（Line API）

首次執行時需要授權這些權限。

## 注意事項

1. 確保 `inReach_monitor` 試算表存在且可存取
2. Config 分頁的欄位順序必須正確
3. 時間格式需為可解析的日期時間格式
4. `active` 欄位需為 `TRUE` 或 `FALSE`
5. Line 推播失敗不會影響 Gmail 標記與 Sheet 寫入

## 授權條款

MIT License
