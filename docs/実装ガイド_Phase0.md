# 実装ガイド Phase 0

**作成日**: 2025年11月14日  
**対象**: 小規模多機能利用調整システム Phase 0実装  
**目的**: Phase 0で実装する確定事項と実装順序の明確化

---

## 📋 このドキュメントについて

### 役割
- Phase 0で実装すべき確定事項をまとめたもの
- 実装者（GitHub Copilot）が参照する実装の指針
- 設計者が管理（読み取り専用）

### 更新ルール
- **作成者**: 設計者（Claude）
- **更新者**: 設計者のみ
- **実装者**: 読み取り専用
- **フィードバック**: 実装中の問題はチャットで報告

---

## ✅ 確定事項（Phase 0で実装）

### 基本方針

#### 1. データ管理
- ✅ 利用者マスタは**空の状態**で起動
- ✅ **1ヶ月分のみ保持**（容量超過時は自動削除）
- ✅ DEFAULT_USERSは**廃止**
- ✅ データ保存：**セル入力ごとに自動保存**（2025-11-14確定）

#### 2. 月間管理
- ✅ **33セル構造**（左特別 + 1〜31日 + 右特別）
- ✅ 月またぎ宿泊を**特別セル**で管理
- ✅ データ保存キー：`prevMonth`, `nextMonth`

#### 3. 予定入力
- ✅ 記号：**○◓◒入退**（Unicode）
- ✅ 前半後半通いは**右クリックメニューのみ**
- ✅ 削除⇔復元：**5秒間**トグル可能

#### 4. 定員管理
- ✅ 前半・後半の**分離カウント**
- ✅ **最大値**で定員判定
- ✅ **退所日は泊りカウントなし**

#### 5. UI
- ✅ 起動時の画面：**空のグリッド + メッセージ**（2025-11-14確定）
- ✅ 月選択UI：**ドロップダウン（前後3ヶ月）**（2025-11-14確定）
- ✅ 58行 × 33列のグリッド

---

## 🎯 Phase 0の目標

### Phase 0の位置づけ
**既存のPhase 1クラス設計を要件定義書v1.0に適合させる**

### 具体的な作業
- User拡張（sortId追加）
- ScheduleCell拡張（特別セル対応）
- ScheduleCalendar拡張（33セル、月またぎ宿泊）
- DailyCapacity拡張（前半後半カウント）
- AppConfig作成（記号定義、設定値）

---

## 📐 実装順序

### Phase 0-A: User拡張
**所要時間**: 30分

**実装内容**:
1. `sortId` プロパティ追加
2. コンストラクタ修正
3. `toJSON()` / `fromJSON()` 修正

**参照ドキュメント**:
- データモデル設計書_v3.0.md の「User クラス」

---

### Phase 0-B: 特別セル対応
**所要時間**: 2時間

**実装内容**:
1. ScheduleCell の特別セル判定メソッド
   - `isPrevMonthCell()`
   - `isNextMonthCell()`
   - `isSpecialCell()`
2. ScheduleCalendar の特別セル getter/setter
   - `getPrevMonthCell()`
   - `getNextMonthCell()`
   - `setPrevMonthCell()`
   - `setNextMonthCell()`
3. `calculateCrossMonthStay()` 実装
4. `getDaysInMonth()` の33セル対応

**参照ドキュメント**:
- 要件定義書_月間管理_v1.0.md（全セクション）
- データモデル設計書_v3.0.md の「ScheduleCell クラス」「ScheduleCalendar クラス」

---

### Phase 0-C: 定員カウント修正
**所要時間**: 2時間

**実装内容**:
1. ScheduleCell の `getDayCountContribution()` 修正
   - 特別セルは0を返す
   - 退所日は前半1+後半1を返す（泊りフラグはfalse）
2. ScheduleCalendar の `calculateAllFlags()` 修正
   - 退所日の泊りフラグを立てない
3. DailyCapacity の前半後半カウント
   - `dayCountMorning` プロパティ追加
   - `dayCountAfternoon` プロパティ追加
   - `getMaxDayCount()` メソッド追加
4. ServiceCapacity の `checkDate()` 修正
   - 前半後半カウントに対応

**参照ドキュメント**:
- 要件定義書_定員管理_v1.0.md（全セクション）
- データモデル設計書_v3.0.md の「DailyCapacity クラス」「ServiceCapacity クラス」

---

### Phase 0-D: AppConfig拡張
**所要時間**: 1時間

**実装内容**:
1. SYMBOLS 定義
   ```javascript
   SYMBOLS: {
     FULL_DAY: '○',
     MORNING: '◓',
     AFTERNOON: '◒',
     CHECK_IN: '入',
     CHECK_OUT: '退',
     EMPTY: ''
   }
   ```
2. CAPACITY 定義
   ```javascript
   CAPACITY: {
     DAY_LIMIT: 15,
     STAY_LIMIT: 9,
     THRESHOLDS: {
       GOOD: 66,
       OK: 80,
       WARN: 93,
       FULL: 94
     }
   }
   ```
3. STORAGE 定義
   ```javascript
   STORAGE: {
     KEYS: {
       USERS: 'users',
       SCHEDULE: 'schedule_',
       NOTES: 'notes'
     },
     AUTO_SAVE: true
   }
   ```
4. RESTORE_TIMEOUT 定義
   ```javascript
   RESTORE_TIMEOUT: 5000  // 5秒
   ```

**参照ドキュメント**:
- 要件定義書_予定入力_v1.0.md の「1.4 AppConfigでの記号定義」
- 要件定義書_定員管理_v1.0.md の「1.2 AppConfigでの定義」
- 要件定義書_技術仕様_v1.0.md

---

## 📝 各フェーズの詳細タスク

### Phase 0-A: User拡張

#### タスク1: sortId プロパティ追加
```javascript
class User {
  constructor(id, name, registrationDate, sortId = 0) {
    this.id = id;
    this.name = name;
    this.registrationDate = registrationDate;
    this.sortId = sortId;  // ← 追加
    this.note = "";
    this.isActive = true;
  }
}
```

#### タスク2: toJSON / fromJSON 修正
```javascript
toJSON() {
  return {
    id: this.id,
    name: this.name,
    registrationDate: this.registrationDate,
    sortId: this.sortId,  // ← 追加
    note: this.note,
    isActive: this.isActive
  };
}

static fromJSON(data) {
  const user = new User(
    data.id, 
    data.name, 
    data.registrationDate,
    data.sortId || 0  // ← 追加（デフォルト値）
  );
  user.note = data.note || "";
  user.isActive = data.isActive !== false;
  return user;
}
```

---

### Phase 0-B: 特別セル対応

#### タスク1: ScheduleCell の特別セル判定
```javascript
class ScheduleCell {
  // 既存のコンストラクタとメソッド...
  
  // 🆕 特別セル判定メソッド
  isPrevMonthCell() {
    return this.date.includes('prevMonth');
  }
  
  isNextMonthCell() {
    return this.date.includes('nextMonth');
  }
  
  isSpecialCell() {
    return this.isPrevMonthCell() || this.isNextMonthCell();
  }
}
```

#### タスク2: ScheduleCalendar の特別セル getter/setter
```javascript
class ScheduleCalendar {
  // 既存のメソッド...
  
  // 🆕 特別セルを取得
  getPrevMonthCell(cellType = 'dayStay') {
    const key = `${this.yearMonth}-prevMonth_${cellType}`;
    return this.cells.get(key) || null;
  }
  
  getNextMonthCell(cellType = 'dayStay') {
    const key = `${this.yearMonth}-nextMonth_${cellType}`;
    return this.cells.get(key) || null;
  }
  
  // 🆕 特別セルを設定
  setPrevMonthCell(value, cellType = 'dayStay') {
    const date = `${this.yearMonth}-prevMonth`;
    this.setCell(date, cellType, value);
  }
  
  setNextMonthCell(value, cellType = 'dayStay') {
    const date = `${this.yearMonth}-nextMonth`;
    this.setCell(date, cellType, value);
  }
}
```

#### タスク3: calculateCrossMonthStay() 実装
```javascript
calculateCrossMonthStay() {
  const prevMonthCell = this.getPrevMonthCell();
  const nextMonthCell = this.getNextMonthCell();
  
  // 前月から継続する宿泊
  if (prevMonthCell && prevMonthCell.inputValue) {
    // "12/28入" → startDate: "2024-12-28"
    const match = prevMonthCell.inputValue.match(/(\d{1,2})\/(\d{1,2})入/);
    if (match) {
      const month = parseInt(match[1]);
      const day = parseInt(match[2]);
      const prevMonth = DateUtils.getPreviousMonth(this.yearMonth);
      const startDate = `${prevMonth.substring(0, 5)}${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // 当月内の最初の退所を探す
      const firstCheckOut = this.findFirstCheckOut();
      if (firstCheckOut) {
        this.stayPeriods.push(
          new StayPeriod(startDate, firstCheckOut.date, this.userId)
        );
      }
    }
  }
  
  // 翌月まで継続する宿泊
  if (nextMonthCell && nextMonthCell.inputValue) {
    // "1/3退" → endDate: "2026-01-03"
    const match = nextMonthCell.inputValue.match(/(\d{1,2})\/(\d{1,2})退/);
    if (match) {
      const month = parseInt(match[1]);
      const day = parseInt(match[2]);
      const nextMonth = DateUtils.getNextMonth(this.yearMonth);
      const endDate = `${nextMonth.substring(0, 5)}${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // 当月内の最後の入所を探す
      const lastCheckIn = this.findLastCheckIn();
      if (lastCheckIn) {
        this.stayPeriods.push(
          new StayPeriod(lastCheckIn.date, endDate, this.userId)
        );
      }
    }
  }
}
```

#### タスク4: getDaysInMonth() の33セル対応
```javascript
getDaysInMonth() {
  const dates = DateUtils.getDatesInMonth(this.yearMonth);
  
  // 特別セルを追加
  return [
    `${this.yearMonth}-prevMonth`,
    ...dates,
    `${this.yearMonth}-nextMonth`
  ];
}
```

---

### Phase 0-C: 定員カウント修正

#### タスク1: ScheduleCell.getDayCountContribution() 修正
```javascript
getDayCountContribution() {
  // 特別セルは当月の定員カウントに含めない
  if (this.isSpecialCell()) {
    return { morning: 0, afternoon: 0 };
  }
  
  if (this.isFullDay() || this.isStayStart()) {
    return { morning: 1, afternoon: 1 };
  } else if (this.isStayEnd()) {
    // ★重要：退所日は通いカウントのみ、泊りカウントなし
    return { morning: 1, afternoon: 1 };
  } else if (this.isMorning()) {
    return { morning: 1, afternoon: 0 };
  } else if (this.isAfternoon()) {
    return { morning: 0, afternoon: 1 };
  } else if (this.actualFlags.stay) {
    // 宿泊中（○）
    return { morning: 1, afternoon: 1 };
  }
  
  return { morning: 0, afternoon: 0 };
}
```

#### タスク2: ScheduleCalendar.calculateAllFlags() 修正
```javascript
calculateAllFlags() {
  // 全セルのフラグをリセット
  for (const cell of this.cells.values()) {
    cell.actualFlags.day = false;
    cell.actualFlags.stay = false;
    cell.actualFlags.visit = 0;
  }
  
  // 宿泊期間に基づいてフラグを設定
  for (const period of this.stayPeriods) {
    const dates = period.getDatesInMonth(this.yearMonth);
    
    for (const date of dates) {
      const cell = this.getCell(date, 'dayStay');
      if (cell) {
        cell.actualFlags.day = true;
        
        // ★重要：退所日は泊りフラグを立てない
        if (date !== period.endDate) {
          cell.actualFlags.stay = true;
        }
      }
    }
  }
  
  // 通いセルのフラグを設定
  for (const cell of this.cells.values()) {
    if (cell.cellType === 'dayStay' && !cell.isSpecialCell()) {
      if (cell.isFullDay() || cell.isMorning() || cell.isAfternoon()) {
        cell.actualFlags.day = true;
      }
    }
  }
  
  // 訪問セルのフラグを設定
  for (const cell of this.cells.values()) {
    if (cell.cellType === 'visit' && !cell.isSpecialCell()) {
      const visitCount = parseInt(cell.inputValue) || 0;
      cell.actualFlags.visit = visitCount;
    }
  }
}
```

#### タスク3: DailyCapacity の前半後半カウント
```javascript
class DailyCapacity {
  constructor(date, dayLimit = 15, stayLimit = 9) {
    this.date = date;
    
    // 🆕 前半・後半の分離カウント
    this.dayCountMorning = 0;
    this.dayCountAfternoon = 0;
    this.dayCount = 0;  // 互換性のため保持
    
    this.stayCount = 0;
    this.visitCount = 0;
    this.dayLimit = dayLimit;
    this.stayLimit = stayLimit;
  }
  
  // 🆕 前半後半の最大値を取得
  getMaxDayCount() {
    return Math.max(this.dayCountMorning, this.dayCountAfternoon);
  }
  
  // 定員オーバー判定
  isOverCapacity() {
    const maxDayCount = this.getMaxDayCount();
    return maxDayCount > this.dayLimit || this.stayCount > this.stayLimit;
  }
  
  // 定員状況の記号を取得
  getCapacitySymbol() {
    const maxDayCount = this.getMaxDayCount();
    const rate = (maxDayCount / this.dayLimit) * 100;
    
    if (rate <= AppConfig.CAPACITY.THRESHOLDS.GOOD) return '◎';
    if (rate <= AppConfig.CAPACITY.THRESHOLDS.OK) return '○';
    if (rate <= AppConfig.CAPACITY.THRESHOLDS.WARN) return '△';
    return '×';
  }
  
  // 🆕 ツールチップ用の詳細データ
  getTooltipData() {
    return {
      full: this.dayCount,
      morning: this.dayCountMorning,
      afternoon: this.dayCountAfternoon,
      morningOverflow: Math.max(0, this.dayCountMorning - this.dayLimit),
      afternoonOverflow: Math.max(0, this.dayCountAfternoon - this.dayLimit)
    };
  }
}
```

#### タスク4: ServiceCapacity.checkDate() 修正
```javascript
checkDate(date) {
  const capacity = new DailyCapacity(date);
  
  this.calendars.forEach(calendar => {
    const cell = calendar.getCell(date, 'dayStay');
    
    if (cell && cell.actualFlags.day) {
      // 前半後半の判定
      const contribution = cell.getDayCountContribution();
      capacity.dayCountMorning += contribution.morning;
      capacity.dayCountAfternoon += contribution.afternoon;
      
      // 互換性のため全日カウントも更新
      if (contribution.morning === 1 && contribution.afternoon === 1) {
        capacity.dayCount++;
      } else {
        capacity.dayCount += 0.5;
      }
    }
    
    if (cell && cell.actualFlags.stay) {
      capacity.stayCount++;
    }
    
    const visitCell = calendar.getCell(date, 'visit');
    if (visitCell) {
      capacity.visitCount += visitCell.actualFlags.visit;
    }
  });
  
  return capacity;
}
```

---

## ⚠️ 実装時の注意事項

### 1. 後方互換性
- 旧データ形式を読み込めるように
- `sortId` がない場合は 0 をデフォルト値に
- 旧記号（"1"）を新記号（"○"）に自動変換

### 2. データ整合性
- 特別セルと通常セルの整合性チェック
- 退所日の泊りフラグは必ず false
- 月をまたぐ宿泊期間の日付が妥当か確認

### 3. パフォーマンス
- `getDayCountContribution()` の高速化
- 33セル × 29名 = 957セルの効率的な処理
- 定員チェックのキャッシュ活用

### 4. エラーハンドリング
- 特別セルの不正な値（例：`1/3` だけで「退」がない）
- 月をまたぐ宿泊の不整合
- LocalStorage容量超過

---

## 🧪 テスト項目

### Phase 0-A: User拡張
- [ ] sortId が正しく保存・読み込みされる
- [ ] sortId のデフォルト値が 0 になる
- [ ] 旧データ（sortId なし）が読み込める

### Phase 0-B: 特別セル対応
- [ ] isPrevMonthCell() が正しく動作する
- [ ] isNextMonthCell() が正しく動作する
- [ ] getPrevMonthCell() / getNextMonthCell() が正しく動作する
- [ ] calculateCrossMonthStay() が正しく StayPeriod を生成する
- [ ] getDaysInMonth() が 33セルを返す

### Phase 0-C: 定員カウント修正
- [ ] getDayCountContribution() で特別セルが 0 を返す
- [ ] 退所日が前半1+後半1を返す
- [ ] calculateAllFlags() で退所日の泊りフラグが false になる
- [ ] DailyCapacity.getMaxDayCount() が正しく動作する
- [ ] 前半・後半の分離カウントが正しい

### Phase 0-D: AppConfig拡張
- [ ] SYMBOLS が正しく定義されている
- [ ] CAPACITY が正しく定義されている
- [ ] STORAGE が正しく定義されている
- [ ] RESTORE_TIMEOUT が 5000 になっている

---

## 📚 参照ドキュメント

### 要件定義書
- 要件定義書_概要_v1.0.md
- 要件定義書_データ管理_v1.0.md
- 要件定義書_月間管理_v1.0.md
- 要件定義書_予定入力_v1.0.md
- 要件定義書_定員管理_v1.0.md
- 要件定義書_Excel入出力_v1.0.md
- 要件定義書_UI_v1.0.md
- 要件定義書_技術仕様_v1.0.md

### 設計書
- データモデル設計書_v3.0.md
- クラス設計書Phase1.md

### その他
- 未確定項目リスト_v2.0.md（参考）

---

## 📝 実装完了の定義

Phase 0は以下の条件を満たした時点で完了とする：

1. ✅ 全てのテスト項目が合格
2. ✅ 要件定義書v1.0の内容を反映
3. ✅ データモデル設計書_v3.0に準拠
4. ✅ 後方互換性を確保
5. ✅ コンソールにエラーが出ない

---

**作成者**: Claude（設計者）  
**最終更新**: 2025年11月14日  
**バージョン**: 1.0  
**ステータス**: Phase 0実装準備完了