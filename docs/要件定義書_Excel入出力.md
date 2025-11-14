# 要件定義書 v1.0 - Excel入出力編

**作成日**: 2025年11月13日  
**対象**: 小規模多機能利用調整システム - Excel入出力  
**目的**: Excelファイルの構造、出力・読込仕様の要件定義

---

## 📚 本ドキュメントの位置づけ

- **メインドキュメント**: 要件定義書_概要_v1.0.md
- **本ドキュメント**: Excel入出力編
- **関連ドキュメント**: 
  - データ管理編（CSV取り込み）
  - 月間管理編（特別セル）
  - 技術仕様編（SheetJS）

---

## 📊 目次

1. [運用フローとExcelの役割](#1-運用フローとexcelの役割)
2. [Excel出力仕様](#2-excel出力仕様)
3. [Excel読み込み仕様](#3-excel読み込み仕様)
4. [データ不整合の処理](#4-データ不整合の処理)
5. [実装詳細](#5-実装詳細)

---

## 1. 運用フローとExcelの役割

### 1.1 全体フロー

```
【CAREKARTE】
算定基礎（利用パターンを設定）
  ↓ CSV出力
【このアプリ】
  ↓ CSV読込
週間パターン → 月間展開
  ↓ 予定調整
定員チェックしながら調整
  ↓ Excel保存（★このドキュメントの対象）
【CAREKARTE】
  ↓ 算定基礎取り込み
月間利用票（ひな形）生成
  ↓
このアプリのExcelを見ながら手動入力
```

---

### 1.2 Excelの役割

#### 1.2.1 データの保存

**目的**:
- 調整済みの月間予定を保存
- LocalStorageの容量節約
- バックアップとして機能

**保存タイミング**:
- 作業完了時
- 月の切り替え前
- 定期的なバックアップ

---

#### 1.2.2 作業の再開

**目的**:
- 保存したExcelから作業を再開
- 別のPCで作業を継続
- 過去の調整結果を参照

**読み込みタイミング**:
- 作業の再開時
- 月間予定の修正時
- 過去データの参照時

---

#### 1.2.3 CAREKARTEへの連携

**目的**:
- 調整結果をCAREKARTEへ反映
- 手動入力の参照資料

**方法**:
- Excelを見ながら手動入力
- 将来的にはRPA自動入力も検討

---

## 2. Excel出力仕様

### 2.1 ファイル仕様

#### 2.1.1 基本情報

| 項目 | 内容 |
|------|------|
| ファイル名 | `YYYY-MM_調整_yyyymmdd.xlsx` |
| 形式 | Excel 2007以降（.xlsx） |
| シート構成 | 2シート（月間予定 + 利用者情報） |
| 文字コード | UTF-8（Excelの標準） |

**ファイル名の例**:
```
2025-12_調整_20251115.xlsx
↑       ↑        ↑
年月   固定   出力日時
```

---

#### 2.1.2 yyyymmddの部分（未確定）

**Option A: 出力日時**
```
2025-12_調整_20251115.xlsx
              ↑
           出力した日
```

**Option B: 最終編集日時**
```
2025-12_調整_20251115.xlsx
              ↑
        最後に編集した日
```

**Option C: ユーザーが指定**
```
保存ダイアログで日付を選択
```

**推奨**: Option A（出力日時）

**理由**:
- シンプル
- 自動的に決まる
- 同じ月の複数バージョンを区別できる

---

### 2.2 シート1: 月間予定

#### 2.2.1 構造

**33列構成**:
```
列A: 利用者名
列B: 前月（左特別セル）
列C: 1日
列D: 2日
...
列AF: 31日
列AG: 翌月（右特別セル）
```

**各利用者2行**:
- 1行目：通泊行
- 2行目：訪問行

---

#### 2.2.2 ヘッダー行

**列ヘッダー**:
```
┌────┬──────┬──┬──┬───┬──┬──────┐
│利用者│ 前月  │1 │2 │...│31│ 翌月  │
└────┴──────┴──┴──┴───┴──┴──────┘
```

**左特別セル（列B）のヘッダー（未確定）**:

**Option A: 「前月」**
- シンプル
- 意味が明確

**Option B: 「前月継続」**
- より詳細
- 長い

**Option C: 空白**
- 最小限
- 意味が不明瞭

**推奨**: Option A（「前月」）

---

**右特別セル（列AG）のヘッダー（未確定）**:

**Option A: 「翌月」**
- シンプル
- 意味が明確

**Option B: 「翌月継続」**
- より詳細
- 長い

**Option C: 空白**
- 最小限
- 意味が不明瞭

**推奨**: Option A（「翌月」）

---

#### 2.2.3 行ヘッダー（利用者名）

**Option A: 1行目に利用者名、2行目は空白**
```
┌────┬───┬───┐
│青柳│ ○ │入  │ ← 1行目（通泊行）
│    │ 1 │   │ ← 2行目（訪問行）
├────┼───┼───┤
│安藤│入  │ ○ │
│    │   │ 2 │
└────┴───┴───┘
```

**Option B: 1行目と2行目に同じ利用者名**
```
┌────┬───┬───┐
│青柳│ ○ │入  │
│青柳│ 1 │   │
├────┼───┼───┤
│安藤│入  │ ○ │
│安藤│   │ 2 │
└────┴───┴───┘
```

**Option C: 1行目に利用者名、2行目に「（訪問）」**
```
┌────────┬───┬───┐
│青柳    │ ○ │入  │
│（訪問）│ 1 │   │
├────────┼───┼───┤
│安藤    │入  │ ○ │
│（訪問）│   │ 2 │
└────────┴───┴───┘
```

**推奨**: Option A（1行目に利用者名、2行目は空白）

**理由**:
- 見やすい
- Excel標準の結合セル機能で実現可能
- データのパースが容易

---

#### 2.2.4 セルの値

**通泊行**:
| 値 | 意味 |
|----|------|
| ○ | 通い全日 |
| ◓ | 前半通い |
| ◒ | 後半通い |
| 入 | 入所 |
| 退 | 退所 |
| 空白 | 利用なし |

**特別セル**:
| 値 | 意味 |
|----|------|
| 12/28入 | 前月28日入所 |
| 1/3退 | 翌月3日退所 |
| 空白 | 月またぎ宿泊なし |

**訪問行**:
| 値 | 意味 |
|----|------|
| 1, 2, 3, ... | 訪問回数 |
| 空白 | 訪問なし |

---

#### 2.2.5 セルのスタイル

**宿泊期間の背景色**:
```javascript
// 宿泊期間（入所〜退所）
fill: {
  fgColor: { rgb: 'E8F4F8' }  // 極薄青
}

// 入所セル
fill: {
  fgColor: { rgb: 'D0E8F0' }  // 少し濃い青
}

// 左罫線
border: {
  left: {
    style: 'thick',
    color: { rgb: '0066CC' }  // 青
  }
}
```

**定員オーバーの背景色**:
```javascript
fill: {
  fgColor: { rgb: 'FFE6E6' }  // 薄赤
}
```

**特別セルの背景色**:
```javascript
fill: {
  fgColor: { rgb: 'F5F5F5' }  // 灰色
}

border: {
  top: { style: 'dashed', color: { rgb: '999999' } },
  right: { style: 'dashed', color: { rgb: '999999' } },
  bottom: { style: 'dashed', color: { rgb: '999999' } },
  left: { style: 'dashed', color: { rgb: '999999' } }
}
```

---

#### 2.2.6 備考の表現

**Option A: セルのコメント機能**
```
┌───┐
│ ○▼│ ← 右上に赤い三角
└───┘

マウスオーバー:
┌──────────────┐
│この日は家族行事│
│のため不可      │
└──────────────┘
```

**Option B: 別列に備考列を追加**
```
┌────┬───┬───┬──────────┐
│利用者│1 │2 │備考      │
├────┼───┼───┼──────────┤
│青柳│入  │ ○ │1日: 家族行事│
│    │ 1 │   │        │
└────┴───┴───┴──────────┘
```

**推奨**: Option A（コメント機能）

**理由**:
- Excelの標準機能
- レイアウトがシンプル
- 大量の備考に対応可能

---

### 2.3 シート2: 利用者情報

#### 2.3.1 列構成

```
列A: ID（user001, user002, ...）
列B: 氏名
列C: 登録日
列D: ソートID
列E: 週間パターン_通い（月,火,水,木,金,土,日）
列F: 週間パターン_訪問（月,火,水,木,金,土,日）
列G: 週間パターン_宿泊（月,火,水,木,金,土,日）
列H: 利用者備考
列I: 有効フラグ
```

---

#### 2.3.2 データ例

```
| ID      | 氏名      | 登録日     | ソートID | 通い_週間      | 訪問_週間 | 宿泊_週間 | 備考             | 有効 |
|---------|-----------|-----------|---------|---------------|----------|----------|------------------|------|
| user001 | 青柳美秋  | 2024-01-01| 1       | -,1,-,1,-,1,- | -,-,3,-,-,-,- |          | 毎月第3週は家族旅行 | TRUE |
| user002 | 安藤敏子  | 2024-02-15| 2       | 1,1,1,1,-,1,1 | -,1,-,-,-,1,- | -,1,1,-,-,1,1 |                | TRUE |
| user003 | 天野花子  | 2024-03-10| 3       | 1,-,1,-,1,-,- | 1,1,1,1,1,-,- |          |                | TRUE |
```

---

#### 2.3.3 週間パターンの形式

**形式**: カンマ区切り（月,火,水,木,金,土,日）

**通いパターン**:
- `-`: 利用なし
- `1`: 利用あり

**訪問パターン**:
- `-`: 訪問なし
- `1`, `2`, `3`, ...: 訪問回数

**宿泊パターン**:
- 空白: 宿泊なし
- `-`: 宿泊なし
- `1`: 宿泊あり

**例**:
```javascript
// 通いパターン: 火・木・土に通い
"-,1,-,1,-,1,-"

// 訪問パターン: 月に3回、水に2回
"3,-,2,-,-,-,-"

// 宿泊パターン: 火・水・土・日に宿泊
"-,1,1,-,-,1,1"
```

---

### 2.4 出力処理の流れ

#### 2.4.1 処理フロー

```
1. 現在の月間予定を取得
   ↓
2. ワークブック作成
   ↓
3. シート1（月間予定）生成
   - ヘッダー行
   - 利用者ごとに2行（通泊行 + 訪問行）
   - スタイル適用
   ↓
4. シート2（利用者情報）生成
   - ヘッダー行
   - 利用者データ
   ↓
5. ファイル名生成
   ↓
6. ダウンロード実行
```

---

#### 2.4.2 実装イメージ

```javascript
async function exportToExcel() {
  try {
    // 1. データ取得
    const yearMonth = this.app.controllers.schedule.getCurrentYearMonth();
    const users = this.app.controllers.schedule.users;
    const calendars = this.app.controllers.schedule.getAllCalendars();
    
    // 2. ワークブック作成
    const workbook = XLSX.utils.book_new();
    
    // 3. シート1生成
    const monthlySheet = createMonthlySheet(yearMonth, calendars, users);
    XLSX.utils.book_append_sheet(workbook, monthlySheet, '月間予定');
    
    // 4. シート2生成
    const userSheet = createUserSheet(users);
    XLSX.utils.book_append_sheet(workbook, userSheet, '利用者情報');
    
    // 5. ファイル名生成
    const filename = generateFilename(yearMonth);
    
    // 6. ダウンロード
    XLSX.writeFile(workbook, filename);
    
    this.app.showToast('Excelファイルを保存しました', 'success');
    
  } catch (error) {
    Logger?.error('Excel export failed:', error);
    this.app.showToast('保存に失敗しました', 'error');
  }
}

function generateFilename(yearMonth) {
  const now = new Date();
  const dateStr = DateUtils.formatDate(now, 'yyyyMMdd');
  return `${yearMonth}_調整_${dateStr}.xlsx`;
}
```

---

## 3. Excel読み込み仕様

### 3.1 基本フロー

#### 3.1.1 処理フロー

```
1. ファイル選択
   ↓
2. ファイル読み込み
   ↓
3. シート1（月間予定）をパース
   ↓
4. シート2（利用者情報）をパース
   ↓
5. データ整合性チェック
   ├─ OK → 6へ
   └─ NG → 補正ダイアログ表示 → 補正 → 6へ
   ↓
6. LocalStorageに保存
   ↓
7. 予定グリッド画面に遷移
```

---

#### 3.1.2 実装イメージ

```javascript
async function importFromExcel(file) {
  try {
    // 1. ファイル読み込み
    const workbook = await XLSX.read(await file.arrayBuffer());
    
    // 2. シート存在チェック
    if (!workbook.Sheets['月間予定']) {
      throw new Error('「月間予定」シートが見つかりません');
    }
    if (!workbook.Sheets['利用者情報']) {
      throw new Error('「利用者情報」シートが見つかりません');
    }
    
    // 3. シート1パース
    const monthlyData = parseMonthlySheet(workbook.Sheets['月間予定']);
    
    // 4. シート2パース
    const userData = parseUserSheet(workbook.Sheets['利用者情報']);
    
    // 5. データ整合性チェック
    const issues = checkDataIntegrity(monthlyData, userData);
    if (issues.length > 0) {
      const fixed = await showFixDialog(issues);
      if (!fixed) {
        throw new Error('データ不整合の修正がキャンセルされました');
      }
    }
    
    // 6. LocalStorage保存
    this.app.controllers.schedule.saveUsers(userData.users);
    this.app.controllers.schedule.saveSchedule(monthlyData.yearMonth, monthlyData.calendars);
    
    // 7. UI更新
    this.app.switchMonth(monthlyData.yearMonth);
    this.app.showToast('Excelファイルを読み込みました', 'success');
    
  } catch (error) {
    Logger?.error('Excel import failed:', error);
    this.app.showToast(`読み込みに失敗しました: ${error.message}`, 'error');
  }
}
```

---

### 3.2 シート1のパース

#### 3.2.1 ヘッダー行の処理

```javascript
function parseMonthlySheet(sheet) {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const header = data[0];
  
  // 年月を判定（ファイル名またはヘッダーから）
  const yearMonth = detectYearMonth(header);
  
  // 日付列を抽出（1〜31日 + 特別セル）
  const dates = [];
  for (let i = 1; i < header.length; i++) {
    const cellValue = header[i];
    
    if (cellValue === '前月' || cellValue === '') {
      dates.push(`${yearMonth}-prevMonth`);
    } else if (cellValue === '翌月') {
      dates.push(`${yearMonth}-nextMonth`);
    } else {
      const day = parseInt(cellValue);
      if (!isNaN(day) && day >= 1 && day <= 31) {
        dates.push(`${yearMonth}-${String(day).padStart(2, '0')}`);
      }
    }
  }
  
  // ... 以下、データ行の処理
}
```

---

#### 3.2.2 データ行の処理

```javascript
function parseDataRows(data, dates, yearMonth) {
  const calendars = {};
  
  for (let i = 1; i < data.length; i += 2) {
    const dayStayRow = data[i];
    const visitRow = data[i + 1];
    
    // 利用者名
    const userName = dayStayRow[0];
    if (!userName) continue;
    
    // 利用者IDを検索（利用者情報シートから）
    const userId = findUserIdByName(userName);
    if (!userId) {
      Logger?.warn(`User not found: ${userName}`);
      continue;
    }
    
    // カレンダー生成
    const calendar = new ScheduleCalendar(userId, yearMonth);
    
    // セルデータ
    for (let j = 0; j < dates.length; j++) {
      const date = dates[j];
      const dayStayValue = dayStayRow[j + 1];
      const visitValue = visitRow[j + 1];
      
      if (dayStayValue) {
        calendar.setCell(date, 'dayStay', dayStayValue);
      }
      
      if (visitValue) {
        calendar.setCell(date, 'visit', String(visitValue));
      }
    }
    
    // 宿泊期間を計算
    calendar.calculateStayPeriods();
    calendar.calculateAllFlags();
    
    calendars[userId] = calendar;
  }
  
  return { yearMonth, calendars };
}
```

---

### 3.3 シート2のパース

```javascript
function parseUserSheet(sheet) {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const users = [];
  
  // ヘッダー行をスキップ（data[0]）
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    const user = new User(
      row[0],  // ID
      row[1],  // 氏名
      row[2],  // 登録日
      row[3]   // ソートID
    );
    
    user.note = row[7] || '';
    user.isActive = row[8] !== 'FALSE';
    
    users.push(user);
  }
  
  return { users };
}
```

---

### 3.4 バリデーション

#### 3.4.1 ファイル名のチェック（オプション）

**厳密にチェックする場合**:
```javascript
function validateFilename(filename) {
  const pattern = /^\d{4}-\d{2}_調整_\d{8}\.xlsx$/;
  return pattern.test(filename);
}
```

**推奨**: チェックしない

**理由**:
- ファイル名を変更しても読み込めるべき
- 柔軟性を重視

---

#### 3.4.2 シート構造のチェック

**必須チェック**:
```javascript
function validateSheetStructure(workbook) {
  const errors = [];
  
  // シートの存在チェック
  if (!workbook.Sheets['月間予定']) {
    errors.push('「月間予定」シートが見つかりません');
  }
  if (!workbook.Sheets['利用者情報']) {
    errors.push('「利用者情報」シートが見つかりません');
  }
  
  // 列数のチェック（月間予定）
  const monthlySheet = workbook.Sheets['月間予定'];
  if (monthlySheet) {
    const range = XLSX.utils.decode_range(monthlySheet['!ref']);
    const columnCount = range.e.c - range.s.c + 1;
    
    if (columnCount !== 33) {
      errors.push(`月間予定シートの列数が不正です（期待: 33列、実際: ${columnCount}列）`);
    }
  }
  
  return errors;
}
```

---

#### 3.4.3 セルの値のチェック

**通泊行の値**:
```javascript
const validDayStayValues = ['○', '◓', '◒', '入', '退', ''];

function validateDayStayCell(value) {
  // 特別セルの形式チェック（例: "12/28入", "1/3退"）
  if (/^\d{1,2}\/\d{1,2}[入退]$/.test(value)) {
    return true;
  }
  
  // 通常セルの値チェック
  return validDayStayValues.includes(value);
}
```

**訪問行の値**:
```javascript
function validateVisitCell(value) {
  if (value === '' || value === null || value === undefined) {
    return true;
  }
  
  const num = parseInt(value);
  return !isNaN(num) && num >= 1;
}
```

---

## 4. データ不整合の処理

### 4.1 不整合パターン

#### 4.1.1 入所のみで退所なし

**検出**:
```javascript
function checkMissingCheckOut(calendar) {
  const cells = calendar.cells;
  let hasCheckIn = false;
  let hasCheckOut = false;
  
  for (const cell of cells.values()) {
    if (cell.cellType === 'dayStay' && !cell.isSpecialCell()) {
      if (cell.isStayStart()) hasCheckIn = true;
      if (cell.isStayEnd()) hasCheckOut = true;
    }
  }
  
  if (hasCheckIn && !hasCheckOut) {
    return {
      type: 'MISSING_CHECK_OUT',
      userId: calendar.userId,
      message: '入所はありますが退所がありません'
    };
  }
  
  return null;
}
```

---

#### 4.1.2 退所のみで入所なし

**検出**:
```javascript
function checkMissingCheckIn(calendar) {
  const cells = calendar.cells;
  let hasCheckIn = false;
  let hasCheckOut = false;
  
  for (const cell of cells.values()) {
    if (cell.cellType === 'dayStay' && !cell.isSpecialCell()) {
      if (cell.isStayStart()) hasCheckIn = true;
      if (cell.isStayEnd()) hasCheckOut = true;
    }
  }
  
  if (!hasCheckIn && hasCheckOut) {
    return {
      type: 'MISSING_CHECK_IN',
      userId: calendar.userId,
      message: '退所はありますが入所がありません'
    };
  }
  
  return null;
}
```

---

#### 4.1.3 左特別セルのみ（退所なし）

**検出**:
```javascript
function checkPrevMonthOnly(calendar) {
  const prevMonthCell = calendar.getPrevMonthCell();
  
  if (prevMonthCell && prevMonthCell.inputValue) {
    // 当月内に退所があるかチェック
    const hasCheckOut = Array.from(calendar.cells.values())
      .some(cell => cell.cellType === 'dayStay' && 
                    !cell.isSpecialCell() && 
                    cell.isStayEnd());
    
    if (!hasCheckOut) {
      return {
        type: 'PREV_MONTH_NO_CHECK_OUT',
        userId: calendar.userId,
        message: '前月から入所していますが退所日が設定されていません'
      };
    }
  }
  
  return null;
}
```

---

#### 4.1.4 右特別セルのみ（入所なし）

**検出**:
```javascript
function checkNextMonthOnly(calendar) {
  const nextMonthCell = calendar.getNextMonthCell();
  
  if (nextMonthCell && nextMonthCell.inputValue) {
    // 当月内に入所があるかチェック
    const hasCheckIn = Array.from(calendar.cells.values())
      .some(cell => cell.cellType === 'dayStay' && 
                    !cell.isSpecialCell() && 
                    cell.isStayStart());
    
    if (!hasCheckIn) {
      return {
        type: 'NEXT_MONTH_NO_CHECK_IN',
        userId: calendar.userId,
        message: '翌月まで退所していますが入所日が設定されていません'
      };
    }
  }
  
  return null;
}
```

---

### 4.2 補正ダイアログ

#### 4.2.1 ダイアログの表示

```
┌─────────────────────────────────┐
│ データ不整合が検出されました      │
├─────────────────────────────────┤
│ 青柳美秋さんの12月                │
│ 入所はありますが退所がありません  │
│                                   │
│ 退所日を設定しますか？            │
│                                   │
│ [日付を選択]                      │
│ [このまま読み込む]                │
│ [キャンセル]                      │
└─────────────────────────────────┘
```

---

#### 4.2.2 補正オプション

**[日付を選択]をクリック**:
```
カレンダーピッカー表示
  ↓
退所日を選択
  ↓
データを補正
  ↓
読み込み続行
```

**[このまま読み込む]をクリック**:
```
警告を無視
  ↓
不整合なデータのまま読み込み
  ↓
ユーザーが後で手動修正
```

**[キャンセル]をクリック**:
```
読み込み中止
  ↓
Excelファイルを修正して再試行
```

---

#### 4.2.3 実装イメージ

```javascript
async function showFixDialog(issues) {
  for (const issue of issues) {
    const result = await showIssueDialog(issue);
    
    if (result === 'CANCEL') {
      return false;  // 読み込み中止
    }
    
    if (result === 'SKIP') {
      continue;  // このまま読み込む
    }
    
    if (result.type === 'FIX') {
      // データを補正
      applyFix(issue, result.fixData);
    }
  }
  
  return true;  // 読み込み続行
}

function showIssueDialog(issue) {
  return new Promise((resolve) => {
    const dialog = document.createElement('div');
    dialog.className = 'fix-dialog';
    dialog.innerHTML = `
      <div class="fix-dialog-content">
        <h3>データ不整合が検出されました</h3>
        <p>${getUserName(issue.userId)}さんの${issue.yearMonth}</p>
        <p>${issue.message}</p>
        
        ${issue.type === 'MISSING_CHECK_OUT' ? `
          <p>退所日を設定しますか？</p>
          <button class="btn-select-date">日付を選択</button>
        ` : ''}
        
        <button class="btn-skip">このまま読み込む</button>
        <button class="btn-cancel">キャンセル</button>
      </div>
    `;
    
    // イベントリスナー設定
    // ...
    
    document.body.appendChild(dialog);
  });
}
```

---

## 5. 実装詳細

### 5.1 SheetJSの使用

#### 5.1.1 ライブラリの読み込み

```html
<!-- CDN -->
<script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"></script>
```

**バージョン**: 0.20.1以降

---

#### 5.1.2 基本的な使い方

**ワークブック作成**:
```javascript
const workbook = XLSX.utils.book_new();
```

**シート作成（配列から）**:
```javascript
const data = [
  ['利用者', '1', '2', '3'],
  ['青柳美秋', '○', '入', '○']
];

const sheet = XLSX.utils.aoa_to_sheet(data);
XLSX.utils.book_append_sheet(workbook, sheet, 'シート名');
```

**ファイル書き込み**:
```javascript
XLSX.writeFile(workbook, 'filename.xlsx');
```

**ファイル読み込み**:
```javascript
const file = event.target.files[0];
const arrayBuffer = await file.arrayBuffer();
const workbook = XLSX.read(arrayBuffer);
```

---

### 5.2 スタイルの適用

#### 5.2.1 セルのスタイル

**SheetJSでのスタイル指定**:
```javascript
// セルオブジェクト
const cell = {
  v: '○',  // 値
  t: 's',  // 型（s: 文字列）
  s: {     // スタイル
    fill: {
      fgColor: { rgb: 'E8F4F8' }  // 背景色
    },
    font: {
      bold: true,
      color: { rgb: '000000' }
    },
    border: {
      left: { style: 'thick', color: { rgb: '0066CC' } }
    },
    alignment: {
      horizontal: 'center',
      vertical: 'center'
    }
  }
};
```

---

#### 5.2.2 範囲へのスタイル適用

```javascript
function applyStayPeriodStyle(sheet, startRow, endRow, startCol, endCol) {
  for (let R = startRow; R <= endRow; R++) {
    for (let C = startCol; C <= endCol; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = sheet[cellAddress];
      
      if (!cell) continue;
      
      // 宿泊期間のスタイル
      cell.s = {
        fill: { fgColor: { rgb: 'E8F4F8' } },
        border: {
          left: { style: 'thick', color: { rgb: '0066CC' } }
        }
      };
    }
  }
}
```

---

#### 5.2.3 定員オーバーのスタイル

```javascript
function applyOverCapacityStyle(sheet, calendars, dates) {
  const overDates = getOverCapacityDates(calendars);
  
  overDates.forEach(date => {
    const colIndex = dates.indexOf(date) + 1;  // +1 for 利用者名列
    
    calendars.forEach((calendar, userIndex) => {
      const rowIndex = userIndex * 2 + 1;  // +1 for ヘッダー行
      const cellAddress = XLSX.utils.encode_cell({ 
        r: rowIndex, 
        c: colIndex 
      });
      
      const cell = sheet[cellAddress];
      if (cell) {
        cell.s = {
          ...cell.s,
          fill: { fgColor: { rgb: 'FFE6E6' } }  // 薄赤
        };
      }
    });
  });
}
```

---

### 5.3 備考の処理

#### 5.3.1 セルコメントの追加

```javascript
function addCellComment(sheet, cellAddress, comment) {
  if (!sheet['!comments']) {
    sheet['!comments'] = [];
  }
  
  const cell = XLSX.utils.decode_cell(cellAddress);
  
  sheet['!comments'].push({
    ref: cellAddress,
    a: 'システム',  // 作成者
    t: comment      // コメント内容
  });
}
```

**使用例**:
```javascript
// 備考をセルコメントとして追加
const note = getNoteForCell(userId, date);
if (note) {
  const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
  addCellComment(sheet, cellAddress, note.content);
}
```

---

#### 5.3.2 コメントの読み込み

```javascript
function readCellComment(sheet, cellAddress) {
  if (!sheet['!comments']) return null;
  
  const comment = sheet['!comments'].find(c => c.ref === cellAddress);
  return comment ? comment.t : null;
}
```

---

### 5.4 エラーハンドリング

#### 5.4.1 出力時のエラー

**考えられるエラー**:
- ブラウザの権限エラー
- ディスク容量不足
- データが大きすぎる

**処理**:
```javascript
try {
  XLSX.writeFile(workbook, filename);
  this.app.showToast('Excelファイルを保存しました', 'success');
} catch (error) {
  Logger?.error('Excel export failed:', error);
  
  if (error.name === 'SecurityError') {
    this.app.showToast('ファイルの保存権限がありません', 'error');
  } else if (error.name === 'QuotaExceededError') {
    this.app.showToast('ディスク容量が不足しています', 'error');
  } else {
    this.app.showToast(`保存に失敗しました: ${error.message}`, 'error');
  }
}
```

---

#### 5.4.2 読み込み時のエラー

**考えられるエラー**:
- ファイル形式が不正
- シート構造が不正
- データが破損している

**処理**:
```javascript
try {
  const workbook = XLSX.read(arrayBuffer);
  
  // バリデーション
  const errors = validateSheetStructure(workbook);
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
  
  // パース処理
  // ...
  
} catch (error) {
  Logger?.error('Excel import failed:', error);
  
  if (error.message.includes('Unsupported file')) {
    this.app.showToast('Excelファイル形式が不正です', 'error');
  } else if (error.message.includes('シートが見つかりません')) {
    this.app.showToast(error.message, 'error');
  } else {
    this.app.showToast(`読み込みに失敗しました: ${error.message}`, 'error');
  }
}
```

---

### 5.5 パフォーマンス最適化

#### 5.5.1 大量データの処理

**問題**:
- 29名 × 33列 × 2行 = 1,914セル
- スタイル適用で時間がかかる可能性

**対策**:
```javascript
// バッチ処理
function applyStylesInBatch(sheet, styles) {
  const batch = [];
  
  styles.forEach(style => {
    batch.push(style);
    
    if (batch.length >= 100) {
      applyStylesBatch(sheet, batch);
      batch.length = 0;
    }
  });
  
  if (batch.length > 0) {
    applyStylesBatch(sheet, batch);
  }
}
```

---

#### 5.5.2 プログレス表示

```javascript
async function exportToExcelWithProgress() {
  const progress = showProgressDialog();
  
  try {
    progress.update(0, 'ワークブック作成中...');
    const workbook = XLSX.utils.book_new();
    
    progress.update(20, 'シート1生成中...');
    const monthlySheet = await createMonthlySheet();
    XLSX.utils.book_append_sheet(workbook, monthlySheet, '月間予定');
    
    progress.update(60, 'シート2生成中...');
    const userSheet = await createUserSheet();
    XLSX.utils.book_append_sheet(workbook, userSheet, '利用者情報');
    
    progress.update(80, 'ファイル保存中...');
    XLSX.writeFile(workbook, filename);
    
    progress.update(100, '完了');
    progress.close();
    
  } catch (error) {
    progress.close();
    throw error;
  }
}
```

---

## 📝 実装時の注意事項

### 1. Excel出力
- ファイル名の生成ロジック
- シート構造の正確性
- スタイルの適用
- 備考のコメント化
- エラーハンドリング

### 2. Excel読み込み
- シート存在チェック
- データ型の検証
- 不正な値の処理
- データ整合性チェック
- エラーメッセージの明確化

### 3. データ不整合
- 入所・退所の不一致
- 特別セルの不整合
- 補正ダイアログのUX
- ユーザーの選択肢

### 4. パフォーマンス
- 大量データの効率的な処理
- スタイル適用の最適化
- プログレス表示
- メモリ使用量の監視

---

## 🧪 テスト項目

### Excel出力テスト
- [ ] ファイル名が正しく生成される
- [ ] シート1（月間予定）が正しく生成される
- [ ] シート2（利用者情報）が正しく生成される
- [ ] 33列構造が正しい
- [ ] セルの値が正しい（○◓◒入退）
- [ ] 特別セルが正しく出力される
- [ ] 宿泊期間の背景色が適用される
- [ ] 定員オーバーの背景色が適用される
- [ ] 備考がコメントとして保存される

### Excel読み込みテスト
- [ ] 出力したExcelを正しく読み込める
- [ ] シート1が正しくパースされる
- [ ] シート2が正しくパースされる
- [ ] 特別セルが正しく読み込まれる
- [ ] 宿泊期間が正しく計算される
- [ ] 備考が正しく復元される

### バリデーションテスト
- [ ] シートが存在しない場合にエラーになる
- [ ] 列数が不正な場合にエラーになる
- [ ] 不正な記号がある場合にエラーになる
- [ ] 訪問回数が文字の場合にエラーになる

### データ不整合テスト
- [ ] 入所のみの場合に補正ダイアログが表示される
- [ ] 退所のみの場合に補正ダイアログが表示される
- [ ] 左特別セルのみの場合に補正ダイアログが表示される
- [ ] 右特別セルのみの場合に補正ダイアログが表示される
- [ ] 補正後のデータが正しい

### エラーハンドリングテスト
- [ ] ファイル形式が不正な場合のエラー表示
- [ ] ディスク容量不足時のエラー表示
- [ ] 権限エラー時のエラー表示
- [ ] データ破損時のエラー表示

---

## 📚 関連ドキュメント

- **要件定義書_概要_v1.0.md**: 全体構成
- **要件定義書_データ管理_v1.0.md**: CSV取り込み
- **要件定義書_月間管理_v1.0.md**: 特別セル
- **要件定義書_予定入力_v1.0.md**: 記号定義
- **要件定義書_技術仕様_v1.0.md**: SheetJS
- **Excel入出力仕様書.md**: 詳細仕様
- **データモデル設計書_v3.0.md**: データ構造
- **クラス設計書Phase1.md**: ExcelController, ExcelService

---

## 📝 改訂履歴

| 日付 | 版 | 変更内容 | 担当 |
|------|-----|----------|------|
| 2025-11-13 | 1.0 | 初版作成（分割版） | Claude |

---

**作成者**: Claude  
**最終更新**: 2025年11月13日  
**バージョン**: 1.0  
**ステータス**: レビュー待ち