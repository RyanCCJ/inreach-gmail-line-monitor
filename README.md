# Garmin inReach Gmail 監控系統

<div align="center">
  <img src="inreach-mini.png" width="120" alt="Garmin inReach Mini" style="border-radius: 10px; margin: 20px 0;" />
</div>

使用 Google Apps Script 自動監控 Garmin inReach 發送的郵件，解析訊息內容並寫入 Google Sheet，同時推送 Line 通知。包含一個現代化的 Web App 管理介面，方便管理隊伍與監控設定。

## 功能特色

- **Web App 管理介面**
  - 視覺化管理 inReach 與隊伍設定
  - 即時調整掃描頻率
- **自動監控**
  - 自動搜尋 Gmail 中的 inReach 郵件
  - 解析寄件者名稱、訊息內容與 Garmin Explore 連結
  - 使用 Gmail Label 避免重複處理
- **資料整合**
  - 根據隊伍設定自動分類並寫入對應分頁
  - 支援時間範圍設定，只處理活躍隊伍的訊息
- **即時通知**
  - 透過 Line Messaging API 推送即時通知

## 專案結構

```
inreach-gmail-line-monitor/
├── .clasp.json         # CLASP 配置
├── webapp.gs           # Web App 服務端 API
├── index.html          # Web App 管理介面
├── main.gs             # 主程式入口點
├── config.gs           # Config Sheet 讀取模組
├── gmail.gs            # Gmail 搜尋與標籤模組
├── parser.gs           # 郵件解析模組
├── sheet.gs            # Google Sheet 操作模組
├── line.gs             # Line Messaging API 推播模組
└── inreach-mini.png    # 專案圖示
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

### 4. 推送程式碼

```bash
clasp push
```

### 5. 部署 Web App

1. 開啟 Apps Script 編輯器
2. 點擊「部署」→「新增部署作業」
3. 選擇「網頁應用程式」
4.設定：
   - 執行身分：我
   - 誰可以存取：所有人 (或視需求調整)
5. 取得 Web App URL 即可使用管理介面

## Google Sheet 設定

1. 建立一個名為 `inReach_monitor` 的 Google Sheet
2. 系統會自動建立需要的 `Config` 分頁與欄位
3. 也可透過 Web App 介面直接初始化設定

## Line Bot 設定

1. 在 Line Developers Console 建立 Channel
2. 取得 `Channel Access Token`
3. 在 Apps Script 專案設定的 **Script Properties** 新增：
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - `LINE_USER_ID` (User ID 或 Group ID)

## 使用方式

### 透過 Web App (推薦)
開啟部署後的 Web App URL，即可：
- 新增/修改/刪除 inReach 監控設定
- 調整系統掃描頻率 (1-30 分鐘)
- 查看目前監控狀態

### 手動執行
在 Apps Script 編輯器中執行 `scanInreachMails` 函數。

## 輸出格式

### Google Sheet
自動建立分頁：`YYYYMMDD_隊伍名稱`

| 欄位 | 說明 |
|------|------|
| timestamp | 郵件時間戳記 |
| inreach_name | inReach 裝置名稱 |
| team_name | 隊伍名稱 |
| message_text | 訊息內容 |
| explore_link | Garmin Explore 連結 |
| gmail_message_id | 訊息 ID |

### Line 推播

```text
inReach：{裝置名稱}
Team：{隊伍名稱}
Time: {時間}
Message：{訊息內容}
Link：{連結}
```

## 授權條款

**Personal Use Only / Non-Commercial**
本專案僅供個人學習與非商業用途使用。未經授權禁止用於商業營利行為。
