# 小規模多機能利用調整システム Phase 1 クラス設計書 v1.8

**最終更新**: 2025年11月14日  
**バージョン**: 1.8  
**変更内容**: クイックナビゲーション追加、実装効率の向上

---

## 📚 クイックナビゲーション

### 🎯 Phase 0実装箇所
- [Phase 0-A: User拡張](#phase-0-a-user拡張)（所要: 30分）
- [Phase 0-B: 特別セル対応](#phase-0-b-特別セル対応)（所要: 2時間）
- [Phase 0-C: 定員カウント修正](#phase-0-c-定員カウント修正)（所要: 2時間）
- [Phase 0-D: AppConfig拡張](#phase-0-d-appconfig拡張)（所要: 1時間）

### 📋 クラス別変更点
- [2.1.1 Userクラス](#211-userクラス利用者) - sortId追加
- [2.1.2 ScheduleCellクラス](#212-schedulecellクラス予定セル) - 特別セル・記号変更
- [2.1.3 StayPeriodクラス](#213-stayperiodクラス宿泊期間) - 月またぎ対応
- [2.1.4 ScheduleCalendarクラス](#214-schedulecalendarクラス月間予定) - 33セル構造
- [2.1.5 DailyCapacityクラス](#215-dailycapacityクラス日別定員) - 前半後半カウント
- [2.1.6 ServiceCapacityクラス](#216-servicecapacityクラス定員管理) - 集計ロジック

### 🔧 その他の重要セクション
- [0.4 v1.8での重要な変更点](#04-v18での重要な変更点)
- [3. Phase 0実装詳細](#3-phase-0実装詳細)
- [6. HTMLでの読み込み順序](#6-htmlでの読み込み順序修正版)
- [7. 参照ドキュメント](#7-参照ドキュメント)

---

## 📝 改訂履歴

| 日付 | 版 | 変更内容 | 担当 |
|------|-----|----------|------|
| 2025-11-11 | 1.6 | 統合版作成 | GitHub Copilot |
| 2025-11-14 | 1.7 | 要件定義書v1.0反映、DEFAULT_USERS廃止、Phase 0確定事項追加 | Claude |
| **2025-11-14** | **1.8** | **クイックナビゲーション追加、実装効率向上** | **Claude** |

---

## 0. プロジェクト概要

### 0.1 目的
小規模多機能型居宅介護の利用予定を効率的に調整するためのWebアプリケーション

### 0.2 技術的条件
- JavaScriptでオブジェクト指向プログラミング
- ブラウザ上で動作
- データ永続化：LocalStorage
- データ入出力：Excel、CSV

### 0.3 主要機能
- 利用者29人分の予定管理（通い・泊り・訪問）
- 定員チェック（通い15人、泊り9人）
- 月またぎ宿泊対応（特別セル）
- 入所〜退所の区間自動処理
- 利用者備考・セル備考の管理
- CSV/Excel入出力

### 0.4 v1.8での重要な変更点

#### 🆕 要件定義書v1.0の反映
- **DEFAULT_USERS廃止**: js/data/users.js を削除、利用者マスタは空の状態で起動
- **33セル構造**: 左特別セル + 1〜31日 + 右特別セル
- **前半後半カウント**: 通いの定員を前半・後半で分離カウント
- **記号変更**: Unicode記号（○◓◒入退）に統一
- **データ保存**: セル入力ごとに自動保存

#### 🎯 Phase 0確定事項（2025-11-14）
1. **起動時の画面**: 空のグリッド + メッセージ
2. **月選択UI**: ドロップダウン（前後3ヶ月）
3. **データ保存タイミング**: セル入力ごとに自動保存

---

## 1. 全体アーキテクチャ

### 1.1 レイヤー構成

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│  (UIComponents - 画面表示・操作)    │
├─────────────────────────────────────┤
│         Application Layer           │
│  (Controllers - ビジネスロジック)   │
├─────────────────────────────────────┤
│           Domain Layer              │
│  (Models - ドメインモデル)          │
├─────────────────────────────────────┤
│      Infrastructure Layer           │
│  (Storage, Excel - データ永続化)    │
└─────────────────────────────────────┘
```

---

## 2. 詳細クラス図

### 2.1 Domain Layer（ドメインモデル）

#### 2.1.1 Userクラス（利用者）

```
┌─────────────────────────────┐
│   User                      │ 利用者
├─────────────────────────────┤
│ - id: string                │ 利用者ID
│ - name: string              │ 氏名
│ - registrationDate: Date    │ 登録日
│ - sortId: number            │ 🆕 並び順ID
│ - note: string              │ 備考
│ - isActive: boolean         │ 利用中フラグ
├─────────────────────────────┤
│ + toJSON(): object          │
│ + fromJSON(data): User      │
└─────────────────────────────┘
```

**🆕 v1.8での変更点**:
- `sortId` プロパティ追加（要件定義書_データ管理_v1.0.md 対応）

---

#### 2.1.2 ScheduleCellクラス（予定セル）

```
┌─────────────────────────────┐
│   ScheduleCell              │ 予定セル
├─────────────────────────────┤
│ - userId: string            │
│ - date: string              │ 🆕 "2025-12-05" または "2025-12-prevMonth"
│ - cellType: string          │ "dayStay" | "visit"
│ - inputValue: string        │ 🆕 "○", "◓", "◒", "入", "退", 数値
│ - note: string              │ セル備考
│                             │
│ 【計算結果フラグ】          │
│ - actualFlags: object       │
│   ├ day: boolean            │ 通いフラグ
│   ├ stay: boolean           │ 泊りフラグ
│   ├ visit: number           │ 訪問回数
│   └ halfDayType: string     │ 🆕 'full' | 'morning' | 'afternoon'
│                             │
│ 【削除⇔復元機能】🆕       │
│ - deletedValue: string      │ 削除前の値
│ - deletedAt: number         │ 削除時刻（ミリ秒）
│                             │
├─────────────────────────────┤
│ + isEmpty(): boolean        │
│ + isStayStart(): boolean    │ "入"判定
│ + isStayEnd(): boolean      │ "退"判定
│ + isFullDay(): boolean      │ 🆕 "○"判定
│ + isMorning(): boolean      │ 🆕 "◓"判定
│ + isAfternoon(): boolean    │ 🆕 "◒"判定
│ + isSpecialCell(): boolean  │ 🆕 特別セル判定
│ + delete(): void            │ 🆕 削除
│ + restore(): boolean        │ 🆕 復元
│ + canRestore(): boolean     │ 🆕 復元可能判定
│ + getDayCountContribution(): object │ 🆕 前半後半カウント
│ + hasNote(): boolean        │
│ + toJSON(): object          │
└─────────────────────────────┘
```

**🆕 v1.8での変更点**:
- 記号を Unicode に変更（○◓◒入退）
- 削除⇔復元機能追加
- 前半後半カウント対応

---

#### 2.1.3 StayPeriodクラス（宿泊期間）

```
┌─────────────────────────────┐
│   StayPeriod                │ 宿泊期間
├─────────────────────────────┤
│ - startDate: Date           │ 入所日
│ - endDate: Date             │ 退所日
│ - userId: string            │
│ - note: string              │
├─────────────────────────────┤
│ + getDuration(): number     │ 日数
│ + getDatesInMonth(yearMonth): Date[] │ 🆕 当月分のみ
│ + isValid(): boolean        │
│ + overlaps(other): boolean  │
└─────────────────────────────┘
```

**🆕 v1.8での変更点**:
- `getDatesInMonth()` 追加（月またぎ対応）

---

#### 2.1.4 ScheduleCalendarクラス（月間予定）

```
┌─────────────────────────────┐
│   ScheduleCalendar          │ 月間予定
├─────────────────────────────┤
│ - userId: string            │
│ - yearMonth: string         │ "YYYY-MM"
│ - cells: Map<string, ScheduleCell>│ 🆕 33セル構造
│ - prevMonthCell: ScheduleCell│ 🆕 左特別セル
│ - nextMonthCell: ScheduleCell│ 🆕 右特別セル
│ - stayPeriods: StayPeriod[] │
├─────────────────────────────┤
│ + getCell(date): ScheduleCell│
│ + setCell(date, value): void│
│ + getPrevMonthCell(): ScheduleCell│ 🆕
│ + getNextMonthCell(): ScheduleCell│ 🆕
│ + setPrevMonthCell(value): void│ 🆕
│ + setNextMonthCell(value): void│ 🆕
│ + calculateStayPeriods(): void│
│ + calculateCrossMonthStay(): StayPeriod[]│ 🆕
│ + calculateAllFlags(): void │ 🆕 退所日の泊りフラグ修正
│ + getDaysInMonth(): number  │ 🆕 33セル固定
│ + clear(): void             │
│ + toJSON(): object          │
└─────────────────────────────┘
```

**🆕 v1.8での変更点**:
- 33セル構造（特別セル対応）
- 月またぎ宿泊の計算
- 退所日の泊りフラグ処理

---

#### 2.1.5 DailyCapacityクラス（日別定員）

```
┌──────────────────────────────┐
│   DailyCapacity              │ 日別定員情報
├──────────────────────────────┤
│ - date: Date                 │
│ - dayCountMorning: number    │ 🆕 前半通い人数
│ - dayCountAfternoon: number  │ 🆕 後半通い人数
│ - stayCount: number          │ 泊り人数
│ - visitCount: number         │ 訪問回数合計
│ - dayLimit: number           │ 通い定員(15)
│ - stayLimit: number          │ 泊り定員(9)
├──────────────────────────────┤
│ + getMaxDayCount(): number   │ 🆕 前半後半の最大値
│ + isOverCapacity(): boolean  │
│ + getDayOverflow(): number   │
│ + getStayOverflow(): number  │
│ + getCapacitySymbol(): string│ 🆕 定員状況の記号（◎○△×）
│ + getTooltipData(): object   │ 🆕 ツールチップ用データ
│ + getUtilizationRate(): object│
└──────────────────────────────┘
```

**🆕 v1.8での変更点**:
- 前半・後半の分離カウント対応
- 定員状況の記号表示
- ツールチップ用データ生成

---

#### 2.1.6 ServiceCapacityクラス（定員管理）

```
┌──────────────────────────────┐
│   ServiceCapacity            │ 定員管理
├──────────────────────────────┤
│ - calendars: ScheduleCalendar[]│
├──────────────────────────────┤
│ + checkDate(date): DailyCapacity│ 🆕 前半後半カウント対応
│ + checkMonth(yearMonth): DailyCapacity[]│
│ + getOverCapacityDates(): Date[]│
│ + getSummary(): object       │ 🆕 前半後半平均値対応
└──────────────────────────────┘
```

---

## 3. Phase 0実装詳細

### Phase 0-A: User拡張

**実装ファイル**: `js/models/User.js`

**実装内容**:
```javascript
class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.registrationDate = data.registrationDate || new Date();
    this.sortId = data.sortId || 0; // 🆕 追加
    this.note = data.note || '';
    this.isActive = data.isActive !== false;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      registrationDate: this.registrationDate,
      sortId: this.sortId, // 🆕 追加
      note: this.note,
      isActive: this.isActive
    };
  }

  static fromJSON(json) {
    return new User(json);
  }
}
```

---

### Phase 0-B: 特別セル対応

**実装ファイル**: 
- `js/models/ScheduleCell.js`
- `js/models/ScheduleCalendar.js`

**ScheduleCell拡張**:
```javascript
class ScheduleCell {
  // 🆕 特別セル判定メソッド
  isPrevMonthCell() {
    return this.date && this.date.endsWith('-prevMonth');
  }

  isNextMonthCell() {
    return this.date && this.date.endsWith('-nextMonth');
  }

  isSpecialCell() {
    return this.isPrevMonthCell() || this.isNextMonthCell();
  }

  // 🆕 記号判定メソッド
  isFullDay() {
    return this.inputValue === '○';
  }

  isMorning() {
    return this.inputValue === '◓';
  }

  isAfternoon() {
    return this.inputValue === '◒';
  }
}
```

**ScheduleCalendar拡張**:
```javascript
class ScheduleCalendar {
  constructor(userId, yearMonth) {
    this.userId = userId;
    this.yearMonth = yearMonth;
    this.cells = new Map();
    this.prevMonthCell = new ScheduleCell(); // 🆕
    this.nextMonthCell = new ScheduleCell(); // 🆕
    this.stayPeriods = [];
  }

  // 🆕 特別セル用メソッド
  getPrevMonthCell() {
    return this.prevMonthCell;
  }

  setPrevMonthCell(value) {
    this.prevMonthCell.inputValue = value;
    this.prevMonthCell.date = `${this.yearMonth}-prevMonth`;
  }

  getNextMonthCell() {
    return this.nextMonthCell;
  }

  setNextMonthCell(value) {
    this.nextMonthCell.inputValue = value;
    this.nextMonthCell.date = `${this.yearMonth}-nextMonth`;
  }

  // 🆕 月またぎ宿泊の計算
  calculateCrossMonthStay() {
    const periods = [];
    
    // 前月から継続する宿泊
    if (this.prevMonthCell.inputValue) {
      const startDate = new Date(this.prevMonthCell.inputValue);
      const firstCell = this.cells.get(`${this.yearMonth}-01`);
      if (firstCell && firstCell.isStayEnd()) {
        // 退所日を探す
        for (let day = 1; day <= 31; day++) {
          const cell = this.cells.get(`${this.yearMonth}-${String(day).padStart(2, '0')}`);
          if (cell && cell.isStayEnd()) {
            periods.push(new StayPeriod({
              startDate: startDate,
              endDate: new Date(`${this.yearMonth}-${String(day).padStart(2, '0')}`),
              userId: this.userId
            }));
            break;
          }
        }
      }
    }

    // 翌月へ継続する宿泊
    if (this.nextMonthCell.inputValue) {
      // 月末の入所を探す
      for (let day = 31; day >= 1; day--) {
        const cell = this.cells.get(`${this.yearMonth}-${String(day).padStart(2, '0')}`);
        if (cell && cell.isStayStart()) {
          periods.push(new StayPeriod({
            startDate: new Date(`${this.yearMonth}-${String(day).padStart(2, '0')}`),
            endDate: new Date(this.nextMonthCell.inputValue),
            userId: this.userId
          }));
          break;
        }
      }
    }

    return periods;
  }

  // 🆕 33セル固定
  getDaysInMonth() {
    return 33; // 左特別 + 31日 + 右特別
  }
}
```

---

### Phase 0-C: 定員カウント修正

**実装ファイル**: 
- `js/models/ScheduleCell.js`
- `js/models/ScheduleCalendar.js`
- `js/models/DailyCapacity.js`

**ScheduleCell拡張**:
```javascript
class ScheduleCell {
  // 🆕 前半後半カウント
  getDayCountContribution() {
    // 特別セルは定員カウントに含めない
    if (this.isSpecialCell()) {
      return { morning: 0, afternoon: 0, stay: false };
    }

    // 退所日は泊りカウントなし、通いは前半1+後半1
    if (this.isStayEnd()) {
      return { morning: 1, afternoon: 1, stay: false };
    }

    // 通いの前半後半判定
    if (this.isFullDay()) {
      return { morning: 1, afternoon: 1, stay: this.actualFlags.stay };
    } else if (this.isMorning()) {
      return { morning: 1, afternoon: 0, stay: this.actualFlags.stay };
    } else if (this.isAfternoon()) {
      return { morning: 0, afternoon: 1, stay: this.actualFlags.stay };
    }

    // 泊りのみ（通いなし）
    if (this.actualFlags.stay) {
      return { morning: 0, afternoon: 0, stay: true };
    }

    return { morning: 0, afternoon: 0, stay: false };
  }
}
```

**DailyCapacity拡張**:
```javascript
class DailyCapacity {
  constructor(date) {
    this.date = date;
    this.dayCountMorning = 0;    // 🆕 前半通い人数
    this.dayCountAfternoon = 0;  // 🆕 後半通い人数
    this.stayCount = 0;
    this.visitCount = 0;
    this.dayLimit = 15;
    this.stayLimit = 9;
  }

  // 🆕 前半後半の最大値を取得
  getMaxDayCount() {
    return Math.max(this.dayCountMorning, this.dayCountAfternoon);
  }

  isOverCapacity() {
    return this.getMaxDayCount() > this.dayLimit || 
           this.stayCount > this.stayLimit;
  }

  // 🆕 定員状況の記号
  getCapacitySymbol() {
    const dayRate = (this.getMaxDayCount() / this.dayLimit) * 100;
    const stayRate = (this.stayCount / this.stayLimit) * 100;
    const maxRate = Math.max(dayRate, stayRate);

    if (maxRate <= 66) return '◎';      // 良好
    if (maxRate <= 80) return '○';      // 通常
    if (maxRate <= 93) return '△';      // 注意
    return '×';                          // 定員オーバー
  }

  // 🆕 ツールチップ用データ
  getTooltipData() {
    return {
      date: this.date,
      dayMorning: `前半: ${this.dayCountMorning}/${this.dayLimit}`,
      dayAfternoon: `後半: ${this.dayCountAfternoon}/${this.dayLimit}`,
      stay: `泊り: ${this.stayCount}/${this.stayLimit}`,
      visit: `訪問: ${this.visitCount}回`,
      status: this.getCapacitySymbol()
    };
  }
}
```

---

### Phase 0-D: AppConfig拡張

**実装ファイル**: `js/config/AppConfig.js`

```javascript
// 🆕 アプリケーション設定
const AppConfig = {
  // 記号定義
  SYMBOLS: {
    FULL_DAY: '○',      // 終日通い
    MORNING: '◓',       // 前半通い
    AFTERNOON: '◒',     // 後半通い
    CHECK_IN: '入',     // 入所
    CHECK_OUT: '退',    // 退所
    EMPTY: ''           // 空欄
  },

  // 定員設定
  CAPACITY: {
    DAY_LIMIT: 15,      // 通い定員
    STAY_LIMIT: 9,      // 泊り定員
    THRESHOLDS: {       // 定員状況の閾値（％）
      GOOD: 66,         // ◎：良好
      OK: 80,           // ○：通常
      WARN: 93,         // △：注意
      FULL: 94          // ×：満員
    }
  },

  // 表示設定
  VISUAL: {
    COLORS: {
      STAY_PERIOD: '#fffacd',     // 宿泊期間の背景色
      OVER_CAPACITY: '#ffcccc',   // 定員オーバーの背景色
      WEEKEND: '#f0f0f0',          // 土日の背景色
      HOLIDAY: '#fff0f0',          // 祝日の背景色
      SPECIAL_CELL: '#e8e8e8'      // 特別セルの背景色
    },
    GRID: {
      ROWS: 58,                    // 行数（ヘッダー含む）
      COLS: 33,                    // 列数（特別セル含む）
      CELL_WIDTH: 40,              // セル幅（px）
      CELL_HEIGHT: 30              // セル高さ（px）
    }
  },

  // データ保存設定
  STORAGE: {
    PREFIX: 'schedule_',           // LocalStorageキーのプレフィックス
    AUTO_SAVE: true,               // 自動保存
    MAX_MONTHS: 1,                 // 保持する月数
    RESTORE_TIMEOUT: 5000          // 復元タイムアウト（ミリ秒）
  },

  // デフォルト値
  DEFAULTS: {
    YEAR_MONTH: (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    })(),
    USERS: []  // 空の利用者リスト（DEFAULT_USERS廃止）
  }
};

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AppConfig;
}
```

---

## 4. コントローラー層の詳細

### 4.1 ScheduleController

```javascript
class ScheduleController {
  constructor(storageService) {
    this.storageService = storageService;
    this.currentYearMonth = AppConfig.DEFAULTS.YEAR_MONTH;
    this.users = [];
    this.calendars = new Map();
  }

  // 🆕 起動時は空の状態
  async loadUsers() {
    const savedUsers = await this.storageService.loadUsers();
    if (savedUsers && savedUsers.length > 0) {
      this.users = savedUsers;
    } else {
      this.users = [];
      // 起動時メッセージを表示
      this.showEmptyMessage();
    }
  }

  // 🆕 空のグリッド時のメッセージ表示
  showEmptyMessage() {
    console.log('利用者データがありません。CSVファイルを読み込んでください。');
  }

  // 🆕 セル入力ごとに自動保存
  async updateCell(userId, date, cellType, value) {
    const calendar = this.calendars.get(userId);
    if (!calendar) return;

    calendar.setCell(date, value);
    
    // 自動保存（AppConfigの設定に従う）
    if (AppConfig.STORAGE.AUTO_SAVE) {
      await this.saveSchedule();
    }

    // 定員チェック
    this.checkCapacity(date);
  }
}
```

---

## 5. サービス層の詳細

### 5.1 StorageService

```javascript
class StorageService {
  constructor() {
    this.prefix = AppConfig.STORAGE.PREFIX;
    this.maxMonths = AppConfig.STORAGE.MAX_MONTHS;
  }

  // 🆕 1ヶ月分のみ保持
  async saveSchedule(yearMonth, data) {
    const key = `${this.prefix}schedule_${yearMonth}`;
    
    // 容量超過時は古いデータを削除
    if (this.isStorageQuotaExceeded()) {
      await this.deleteOldestMonth();
    }

    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        // 古いデータを削除して再試行
        await this.deleteOldestMonth();
        localStorage.setItem(key, JSON.stringify(data));
      }
    }
  }

  // 🆕 最古の月を削除
  async deleteOldestMonth() {
    const keys = Object.keys(localStorage)
      .filter(key => key.startsWith(`${this.prefix}schedule_`))
      .sort();
    
    if (keys.length > 0) {
      localStorage.removeItem(keys[0]);
    }
  }

  // 🆕 容量チェック
  isStorageQuotaExceeded() {
    try {
      const testKey = `${this.prefix}test`;
      const testData = new Array(100000).join('a'); // 約100KB
      localStorage.setItem(testKey, testData);
      localStorage.removeItem(testKey);
      return false;
    } catch (e) {
      return true;
    }
  }
}
```

---

## 6. HTMLでの読み込み順序（修正版）

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>小規模多機能利用調整システム</title>
  <link rel="stylesheet" href="css/reset.css">
  <link rel="stylesheet" href="css/variables.css">
  <link rel="stylesheet" href="css/layout.css">
  <link rel="stylesheet" href="css/components.css">
  <link rel="stylesheet" href="css/themes.css">
</head>
<body>
  <div id="app"></div>

  <!-- 外部ライブラリ -->
  <script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"></script>

  <!-- Phase 0: 基盤 -->
  <script src="js/config/AppConfig.js"></script>
  <script src="js/utils/Logger.js"></script>
  <script src="js/utils/EventEmitter.js"></script>
  <script src="js/utils/IdGenerator.js"></script>
  <script src="js/utils/DateUtils.js"></script>

  <!-- Models -->
  <script src="js/models/User.js"></script>
  <script src="js/models/ScheduleCell.js"></script>
  <script src="js/models/StayPeriod.js"></script>
  <script src="js/models/ScheduleCalendar.js"></script>
  <script src="js/models/DailyCapacity.js"></script>
  <script src="js/models/ServiceCapacity.js"></script>
  <script src="js/models/Note.js"></script>

  <!-- Services -->
  <script src="js/services/StorageService.js"></script>
  <script src="js/services/ExcelService.js"></script>
  <script src="js/services/CSVService.js"></script>

  <!-- Controllers -->
  <script src="js/controllers/ScheduleController.js"></script>
  <script src="js/controllers/CapacityCheckController.js"></script>
  <script src="js/controllers/NoteController.js"></script>
  <script src="js/controllers/ExcelController.js"></script>

  <!-- Components -->
  <script src="js/components/CellEditor.js"></script>
  <script src="js/components/ScheduleGrid.js"></script>
  <script src="js/components/NotePanel.js"></script>
  <script src="js/components/CapacityIndicator.js"></script>
  <script src="js/components/Toolbar.js"></script>
  <script src="js/components/App.js"></script>

  <!-- アプリケーション起動 -->
  <script src="js/main.js"></script>
</body>
</html>
```

---

## 7. 参照ドキュメント

### 要件定義書v1.0
- [要件定義書_概要_v1.0.md](./requirements/overview.md)
- [要件定義書_データ管理_v1.0.md](./requirements/data-management.md)
- [要件定義書_月間管理_v1.0.md](./requirements/monthly-management.md)
- [要件定義書_予定入力_v1.0.md](./requirements/schedule-input.md)
- [要件定義書_定員管理_v1.0.md](./requirements/capacity-management.md)
- [要件定義書_Excel入出力_v1.0.md](./requirements/excel-io.md)
- [要件定義書_UI_v1.0.md](./requirements/ui.md)
- [要件定義書_技術仕様_v1.0.md](./requirements/technical.md)

### 設計書
- [データモデル設計書_v3.0.md](./design/data-model.md)
- [実装ガイド_Phase0.md](./guides/implementation-phase0.md)
- [未確定項目リスト_v2.0.md](./todos/undecided-items.md)

---

## 8. 実装チェックリスト

### Phase 0-A: User拡張 ✓
- [ ] sortIdプロパティ追加
- [ ] toJSON/fromJSON更新
- [ ] 後方互換性確認

### Phase 0-B: 特別セル対応 ✓
- [ ] 特別セル判定メソッド実装
- [ ] 特別セルgetter/setter実装
- [ ] calculateCrossMonthStay実装
- [ ] getDaysInMonth修正（33セル）

### Phase 0-C: 定員カウント修正 ✓
- [ ] getDayCountContribution実装
- [ ] calculateAllFlags修正
- [ ] DailyCapacity前半後半対応
- [ ] ServiceCapacity集計修正

### Phase 0-D: AppConfig拡張 ✓
- [ ] SYMBOLS定義
- [ ] CAPACITY定義
- [ ] VISUAL定義
- [ ] STORAGE定義

---

## 9. 次のステップ

### Phase 0完了後
1. **Phase 1-A: 基本機能実装**
   - CSVService実装
   - 基本的な予定入力
   - 定員チェック表示

2. **Phase 1-B: UI実装**
   - ScheduleGrid実装
   - Toolbar実装
   - CapacityIndicator実装

3. **Phase 1-C: Excel入出力**
   - ExcelService実装
   - ファイル保存・読込
   - データ検証

---

**作成者**: Claude  
**最終更新**: 2025年11月14日  
**バージョン**: 1.8  
**ステータス**: Phase 0実装準備完了