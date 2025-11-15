# 実装フィードバック Phase 1-A: CSV取り込み機能（最終版）

**作成日**: 2025年11月15日  
**最終更新**: 2025年11月15日 18:00  
**対象**: Phase 1-A CSV取り込み機能の実装と修正  
**ステータス**: ⚠️ **部分完了**（グリッド表示OK、セルデータ未表示）

---

## 📋 実装概要

### 対象機能
- **CSVService.js**: CSV読み込み・解析サービス
- **ScheduleController.js**: CSV取り込み処理
- **Toolbar.js**: CSV取り込みボタンのイベントハンドラー
- **StorageService.js**: LocalStorage保存機能（キー統一修正）
- **DateUtils.js**: 日付フォーマット処理（拡張）

### 実装結果
- ✅ **CSV取り込み**: 29名の利用者と週間パターンを正しく取り込み
- ✅ **グリッド表示**: 29名の利用者名がグリッドに表示
- ⚠️ **セルデータ**: セル内に予定データ（○、入、退、数字）が**表示されない**

---

## 🐛 発見された問題と修正内容

### 問題1: CSV行が複数行に分割される ✅ 修正完了

#### 発見時の状況
```javascript
// デバッグ出力
総行数: 582
2行目を解析した結果: ['False', '青砥美秋', '11:00']
列数: 3  // ← 本来16列必要
列5（サービスコード）: undefined
```

#### 原因
CSVの「時間」列に改行が含まれていた：
```csv
False,青砥美秋,"11:00
17:00",基本,071111,通所,...
```

この1行のデータが、改行のせいで2行に分かれて読み込まれていた。

#### 修正内容
**新規追加メソッド**: `_parseCSVText()`
- 引用符内の改行を正しく処理
- RFC 4180に準拠したCSVパーサー実装

---

### 問題2: IdGenerator.userId()の引数エラー ✅ 修正完了

#### 発見時のエラー
```
TypeError: existingItems.forEach is not a function
```

#### 原因
`IdGenerator.userId()`に数値を渡していた（配列を期待）

#### 修正内容
ID生成ロジックを直接実装：
```javascript
const userId = `user${String(index + 1).padStart(3, '0')}`;
```

---

### 問題3: LocalStorageキーの不一致 ✅ 修正完了

#### 発見時の状況
```javascript
localStorage.getItem('small_schedule_users')  // null
localStorage.getItem('small_schedule_2025-11') // null
```

#### 原因
- `AppConfig.STORAGE.PREFIX` = `'schedule_'`
- しかし`saveUsers()`では`'users'`を直接使用
- キーが不一致で保存・読み込みが失敗

#### 修正内容
すべてのメソッドでプレフィックスを使用：
```javascript
const key = `${this.prefix}users`;  // 'schedule_users'
localStorage.setItem(key, JSON.stringify(jsonData));
```

**影響範囲**:
- `saveUsers()` / `loadUsers()` / `hasUsers()`
- `exportBackup()` / `importBackup()`

---

### 問題4: DateUtils.formatDate()の柔軟性不足 ✅ 修正完了

#### 発見時のエラー
```
TypeError: date.getFullYear is not a function
    at DateUtils.formatDate (DateUtils.js:45:27)
```

#### 原因
- UI層が第2引数でフォーマット指定（例: `'YYYY年MM月'`）
- 元の実装では第2引数を受け付けていなかった

#### 修正内容
フォーマット文字列対応を追加：
```javascript
static formatDate(date, format = 'YYYY-MM-DD') {
    if (typeof date === 'string') {
        date = this.parseDate(date);
    }
    return format
        .replace('YYYY', year)
        .replace('MM', String(month).padStart(2, '0'))
        .replace('DD', String(day).padStart(2, '0'));
}
```

---

## 📊 動作確認結果

### CSV取り込み - ✅ 成功
```
[CSVService] Parsing 1 CSV file(s)
[CSVService] Total rows parsed: 420
[CSVService] Extracted 29 unique users
[CSVService] Created 29 User objects
[StorageService] Users saved: 29 users
[CSVService] Expanding weekly patterns to monthly for 2025-11
[CSVService] Expanded 29 calendars
[StorageService] Schedule saved: 2025-11, 29 users
[ScheduleController] CSV import completed successfully
```

### グリッド表示 - ✅ 成功
- ✅ 29名の利用者名が縦に表示
- ✅ 日付ヘッダー（1日〜30日）が表示
- ✅ セルが正しく描画
- ✅ 定員状況ヘッダーが表示

### セルデータ表示 - ⚠️ **未解決**

**現象**:
- グリッドは表示される
- 利用者名は表示される
- **セル内に予定記号（○、入、退、数字）が表示されない**
- すべてのセルが空

**確認済み事項**:
```
[CSVService] Expanded 29 calendars
[StorageService] Schedule saved: 2025-11, 29 users
```
→ データ自体は保存されている

---

## 🔍 設計担当への確認事項

### 🔴 緊急：セルデータ表示問題

#### 想定される原因

**1. セルタイプの不一致**

現在のCSVService実装：
```javascript
// CSVService.expandWeeklyToMonthly()
calendar.setCell(date, 'am', AppConfig.SYMBOLS.FULL_DAY);  // 通い
calendar.setCell(date, 'visit', String(visitCount));       // 訪問
calendar.setCell(date, 'am', AppConfig.SYMBOLS.CHECK_IN);  // 宿泊
```

Phase 0の設計仕様：
- `'dayStay'`: 通泊統合行（前半/後半/終日/入所/退所）
- `'visit'`: 訪問行
- `'am'`: 午前セル（特別セル使用時）
- `'pm'`: 午後セル（特別セル使用時）

**質問1**: CSVから展開したデータはどのセルタイプに設定すべきか？
- 通い（○）→ `'dayStay'` or `'am'`？
- 宿泊（入/退/○）→ `'dayStay'` or `'am'`？

**2. ScheduleCalendarのcells構造**

**質問2**: cells Mapのキー形式は？
```javascript
// パターンA
calendar.cells.get('2025-11-15_dayStay')

// パターンB
calendar.cells.get('2025-11-15_am')
```

**3. ScheduleGridのレンダリングロジック**

**質問3**: セルデータの取得方法は？
- `ScheduleGrid.createUserRow()` でどうやってセルを描画？
- `calendar.getCell(date, cellType)` を使っている？
- `cell.inputValue` / `cell.displayValue` のどちらを表示？

#### 調査依頼

設計担当に以下のコードでデータ構造を確認してもらう：

```javascript
// ブラウザコンソールで実行
const controller = window.app?.controllers?.schedule;

// 1. カレンダーデータの確認
console.log('All calendars:', controller?.calendars);

// 2. 最初の利用者のカレンダー詳細
const firstCalendar = controller?.calendars?.get('user001');
console.log('First calendar:', firstCalendar);

// 3. セルデータの構造
console.log('Cells Map:', firstCalendar?.cells);

// 4. 特定の日のセル
const cell1 = firstCalendar?.cells?.get('2025-11-01_dayStay');
const cell2 = firstCalendar?.cells?.get('2025-11-01_am');
console.log('Cell (dayStay):', cell1);
console.log('Cell (am):', cell2);

// 5. セルの値
if (cell1) {
    console.log('inputValue:', cell1.inputValue);
    console.log('displayValue:', cell1.displayValue);
}
```

---

## 📝 今後の作業（優先順位順）

### 🔴 最優先：セルデータ表示問題の解決

**Task**: セルタイプの不一致を修正

**手順**:
1. 設計担当からセルタイプ仕様を確認
2. CSVService.expandWeeklyToMonthly()を修正
3. 動作確認（セルに○、入、退が表示されるか）

**期待される結果**:
```
┌──────────┬─────┬─────┬─────┐
│ 青砥美秋 │  ○  │     │  ○  │
│ 安藤敏子 │     │  入  │  ○  │
└──────────┴─────┴─────┴─────┘
```

---

### 🟡 次の優先度：データ検証強化

**CSVフォーマットバリデーション**:
- 列数チェック（16列必須）
- サービスコードの妥当性チェック
- 利用者名の必須チェック

**エラーメッセージ改善**:
```javascript
throw new Error(
    'CSVファイルの形式が不正です\n' +
    `行${lineNo}: 列数が不足（期待: 16列, 実際: ${cols.length}列）`
);
```

---

### 🟢 今後の改善案

1. **進捗表示**（Phase 2）
   - CSV取り込み中の進捗バー
   - 大量データ対応

2. **CSVプレビュー機能**（Phase 3）
   - 取り込み前のデータ確認画面
   - 利用者の重複チェック

3. **他フォーマット対応**（Phase 4）
   - UTF-8完全対応
   - TSV（タブ区切り）対応

---

## ✅ Phase 1-A 完了チェックリスト

### CSV取り込み機能
- [x] CSVService.js実装完了
- [x] Shift_JIS読み込み対応
- [x] 引用符内改行対応
- [x] 週間パターン抽出（通所・訪問・宿泊）
- [x] 月間展開機能実装
- [x] 宿泊期間調整（入→○→退）実装
- [x] 備考保持ロジック実装
- [x] ScheduleController.importCSV()実装
- [x] Toolbar.jsイベントハンドラー実装
- [x] 29名のCSV取り込み成功
- [x] エラーハンドリング実装
- [x] LocalStorage保存成功（キー統一後）

### UI表示機能
- [x] グリッド表示成功
- [x] 利用者一覧表示成功
- [x] 日付ヘッダー表示成功
- [ ] **セルデータ表示** ← 🔴 **未完了（設計確認待ち）**

### バグ修正
- [x] CSV引用符内改行対応
- [x] IdGenerator引数エラー修正
- [x] StorageServiceキー統一
- [x] DateUtils.formatDate拡張
- [ ] **セルデータ表示問題** ← 🔴 **対応中**

---

## 🔗 関連ドキュメント

- **実装ガイド_Phase1-A_CSVService.md**: 実装仕様書
- **要件定義書_データ管理.md**: CSV取り込み要件（3.2-3.3節）
- **クラス設計書Phase1.md**: CSVServiceクラス設計
- **要件定義書_月間管理.md**: セルタイプ仕様（確認必要）

---

## 💬 実装者コメント

CSV取り込みとグリッド表示までは成功しましたが、**セル内のデータ表示**で問題が発生しています。

データ自体は正しく取り込まれ、LocalStorageにも保存されていることをログで確認済みです。問題は**セルタイプの不一致**が原因と推測されます。

CSVServiceでは`'am'`セルタイプにデータを設定していますが、設計仕様では通泊統合行（`'dayStay'`）を使うべきかもしれません。

設計担当との確認が必要です。

---

**作成者**: GitHub Copilot（実装担当）  
**ステータス**: Phase 1-A 部分完了、設計確認待ち  
**次のアクション**: セルタイプ仕様の確認と修正
