# 実装ガイド Phase 1-A: CSVService実装

**作成日**: 2025年11月15日  
**対象**: CSVService実装（算定基礎取り込み機能）  
**前提**: Phase 0完了済み

---

## 📋 Phase 0完了確認

### ✅ 完了した実装

- **Phase 0-A**: User.sortId プロパティ追加 ✓
- **Phase 0-B**: 特別セル対応（33セル構造） ✓
- **Phase 0-C**: 定員カウント修正（前半後半分離） ✓
- **Phase 0-D**: AppConfig拡張（記号定義） ✓
- **UI層Phase 1**: ScheduleGrid, Toolbar, CapacityIndicator, App.js ✓

### 現在の状態

- ブラウザで画面表示可能
- 空の状態メッセージ表示
- Toolbarボタン配置完了
- コンソール操作可能

---

## 🎯 Phase 1-A の目標

**CSVServiceの実装**により、以下を実現:

1. ✅ ケアカルテからCSV出力された算定基礎を読み込む
2. ✅ 週間パターン（月〜日）を抽出
3. ✅ 週間パターンを月間スケジュールに自動展開
4. ✅ 連続する宿泊を「入所→退所」期間に調整
5. ✅ 既存の備考を保持したまま予定を上書き

---

## 📁 実装するファイル

### 新規作成

**`js/services/CSVService.js`** (約400行)

### 修正が必要なファイル

**`js/controllers/ScheduleController.js`**
- `importCSV()` メソッド追加

**`js/components/Toolbar.js`**
- 「算定一覧を取り込む」ボタンのイベントハンドラー追加

---

## 🏗️ CSVService クラス設計

```javascript
class CSVService {
  constructor() {
    this.logger = new Logger('CSVService');
  }

  // === 公開メソッド ===

  /**
   * 複数CSVファイルを読み込んで利用者パターンを抽出
   * @param {FileList} files - CSVファイルリスト
   * @returns {Promise<{users: User[], weeklyPatterns: Map}>}
   */
  async parseCSVFiles(files) { }

  /**
   * 週間パターンを月間スケジュールに展開
   * @param {Map} weeklyPatterns - 週間パターン
   * @param {string} yearMonth - 対象月 (YYYY-MM)
   * @param {User[]} users - 利用者リスト
   * @returns {Map<userId, ScheduleCalendar>}
   */
  expandWeeklyToMonthly(weeklyPatterns, yearMonth, users) { }

  /**
   * 既存の備考を保持したまま予定を上書き
   * @param {Map} newCalendars - 新しいスケジュール
   * @param {string} yearMonth - 対象月
   * @returns {Map} マージ済みスケジュール
   */
  mergeWithExistingNotes(newCalendars, yearMonth) { }

  // === プライベートメソッド ===

  _decodeShiftJIS(arrayBuffer) { }
  _parseCSVLine(line) { }
  _extractUsersAndPatterns(rows) { }
  _adjustStayPeriods(calendar) { }
}
```

---

## 📐 実装タスク一覧

### Task 1: Shift_JIS読み込み (30分)

**要件定義書**: 要件定義書_データ管理.md 3.2節

**実装内容**:

```javascript
/**
 * Shift_JISでエンコードされたCSVを読み込む
 */
async _decodeShiftJIS(arrayBuffer) {
  try {
    const decoder = new TextDecoder('shift-jis');
    const text = decoder.decode(arrayBuffer);
    return text;
  } catch (error) {
    this.logger.error('Shift_JIS decode failed:', error);
    throw new Error('CSVファイルの文字コードがShift_JISではありません');
  }
}

async parseCSVFiles(files) {
  const allRows = [];
  
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const text = await this._decodeShiftJIS(arrayBuffer);
    
    // 行分割（CRLF対応）
    const lines = text.split(/\r\n|\n/);
    
    // ヘッダー行をスキップして解析
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const row = this._parseCSVLine(lines[i]);
      if (row) allRows.push(row);
    }
  }
  
  return this._extractUsersAndPatterns(allRows);
}

/**
 * CSV行をパース
 */
_parseCSVLine(line) {
  // カンマ区切りでパース（引用符対応）
  const regex = /("(?:[^"]|"")*"|[^,]*)(,|$)/g;
  const values = [];
  let match;
  
  while ((match = regex.exec(line)) !== null) {
    let value = match[1];
    // 引用符を除去
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/""/g, '"');
    }
    values.push(value);
    
    if (match[2] === '') break;
  }
  
  return values.length >= 16 ? values : null;
}
```

**テスト項目**:
- [ ] Shift_JISのCSVを正しく読み込める
- [ ] 複数ファイル（介護+予防）を統合できる
- [ ] 文字化けが発生しない

---

### Task 2: CSV→週間パターン抽出 (1時間)

**要件定義書**: 要件定義書_データ管理.md 3.3節

**実装内容**:

```javascript
/**
 * CSV行から利用者と週間パターンを抽出
 */
_extractUsersAndPatterns(rows) {
  const userMap = new Map(); // userName → { day: [], visit: [], stay: [] }
  
  for (const row of rows) {
    const userName = row[1]; // 列2: 利用者名
    const serviceCode = row[4]; // 列5: サービスコード
    const weekPattern = row.slice(9, 16); // 列10-16: 月〜日
    
    if (!userMap.has(userName)) {
      userMap.set(userName, {
        name: userName,
        dayPattern: ['-','-','-','-','-','-','-'],
        visitPattern: ['0','0','0','0','0','0','0'],
        stayPattern: ['-','-','-','-','-','-','-']
      });
    }
    
    const pattern = userMap.get(userName);
    
    // サービスコードで分類
    if (serviceCode === '071111') {
      // 通所
      pattern.dayPattern = weekPattern.map(v => v === '1' ? '1' : '-');
    } else if (serviceCode === '071121') {
      // 訪問
      pattern.visitPattern = weekPattern.map(v => v || '0');
    } else if (serviceCode === '071131') {
      // 宿泊
      pattern.stayPattern = weekPattern.map(v => v === '1' ? '1' : '-');
    }
  }
  
  // User配列を生成（あいうえお順）
  const userNames = Array.from(userMap.keys()).sort((a, b) => 
    a.localeCompare(b, 'ja')
  );
  
  const users = userNames.map((name, index) => {
    return new User({
      id: `user${String(index + 1).padStart(3, '0')}`,
      name: name,
      registrationDate: new Date(),
      sortId: index
    });
  });
  
  // 週間パターンMapを作成
  const weeklyPatterns = new Map();
  users.forEach(user => {
    const pattern = userMap.get(user.name);
    weeklyPatterns.set(user.id, pattern);
  });
  
  return { users, weeklyPatterns };
}
```

**テスト項目**:
- [ ] 29名の利用者が全て認識される
- [ ] 通所・訪問・宿泊を正しく分類できる
- [ ] あいうえお順にソートされる

---

### Task 3: 週間→月間展開 (1時間)

**要件定義書**: 要件定義書_データ管理.md 3.4節

**実装内容**:

```javascript
/**
 * 週間パターンを月間スケジュールに展開
 */
expandWeeklyToMonthly(weeklyPatterns, yearMonth, users) {
  const calendars = new Map();
  const [year, month] = yearMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  
  for (const user of users) {
    const calendar = new ScheduleCalendar(user.id, yearMonth);
    const pattern = weeklyPatterns.get(user.id);
    
    if (!pattern) {
      calendars.set(user.id, calendar);
      continue;
    }
    
    // 各日付に対して処理
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${yearMonth}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month - 1, day).getDay(); // 0=日, 1=月, ...
      const patternIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 月〜日 → 0〜6
      
      // 通いパターン
      if (pattern.dayPattern[patternIndex] === '1') {
        calendar.setCell(date, 'dayStay', AppConfig.SYMBOLS.FULL_DAY);
      }
      
      // 訪問パターン
      const visitCount = parseInt(pattern.visitPattern[patternIndex], 10);
      if (visitCount > 0) {
        calendar.setCell(date, 'visit', String(visitCount));
      }
      
      // 宿泊パターン（仮で「入」を設定）
      if (pattern.stayPattern[patternIndex] === '1') {
        calendar.setCell(date, 'dayStay', AppConfig.SYMBOLS.CHECK_IN);
      }
    }
    
    // 宿泊期間を調整
    this._adjustStayPeriods(calendar);
    
    calendars.set(user.id, calendar);
  }
  
  return calendars;
}
```

**テスト項目**:
- [ ] 月曜のパターンが全ての月曜に展開される
- [ ] 曜日の判定が正しい
- [ ] 通いと宿泊の混在を正しく処理できる

---

### Task 4: 宿泊期間調整 (1時間)

**要件定義書**: 要件定義書_データ管理.md 3.4.2節

**実装内容**:

```javascript
/**
 * 連続する宿泊を「入所→退所」期間に調整
 */
_adjustStayPeriods(calendar) {
  const dayCells = [];
  
  // 通泊行のセルを日付順に取得
  for (const [key, cell] of calendar.cells) {
    if (cell.cellType === 'dayStay' && 
        cell.inputValue === AppConfig.SYMBOLS.CHECK_IN) {
      dayCells.push(cell);
    }
  }
  
  // 日付順にソート
  dayCells.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // 連続する宿泊をグループ化
  const groups = [];
  let currentGroup = [];
  
  for (let i = 0; i < dayCells.length; i++) {
    const cell = dayCells[i];
    
    if (currentGroup.length === 0) {
      currentGroup.push(cell);
    } else {
      const lastCell = currentGroup[currentGroup.length - 1];
      const lastDate = new Date(lastCell.date);
      const currentDate = new Date(cell.date);
      const dayDiff = (currentDate - lastDate) / (1000 * 60 * 60 * 24);
      
      if (dayDiff === 1) {
        // 連続
        currentGroup.push(cell);
      } else {
        // 新しいグループ
        groups.push(currentGroup);
        currentGroup = [cell];
      }
    }
  }
  
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  
  // 各グループを処理
  for (const group of groups) {
    if (group.length === 1) {
      // 単独宿泊: そのまま（右クリックで退所を手動設定）
      continue;
    } else {
      // 連続宿泊: 入所→○→...→退所
      const firstCell = group[0];
      const lastCell = group[group.length - 1];
      
      // 開始日: 入
      calendar.setCell(firstCell.date, 'dayStay', AppConfig.SYMBOLS.CHECK_IN);
      
      // 中間日: ○
      for (let i = 1; i < group.length - 1; i++) {
        const cell = group[i];
        calendar.setCell(cell.date, 'dayStay', AppConfig.SYMBOLS.FULL_DAY);
      }
      
      // 終了日: 退
      calendar.setCell(lastCell.date, 'dayStay', AppConfig.SYMBOLS.CHECK_OUT);
    }
  }
  
  // StayPeriodを再計算
  calendar.calculateStayPeriods();
}
```

**テスト項目**:
- [ ] 連続する宿泊が「入所→退所」に変換される
- [ ] 飛び飛びの宿泊は各自「入」のまま

---

### Task 5: 備考保持ロジック (30分)

**実装内容**:

```javascript
/**
 * 既存の備考を保持したまま予定を上書き
 */
mergeWithExistingNotes(newCalendars, yearMonth) {
  const storageService = new StorageService();
  const existingData = storageService.loadSchedule(yearMonth);
  
  if (!existingData) {
    return newCalendars;
  }
  
  // 既存の備考を保持
  for (const [userId, newCalendar] of newCalendars) {
    const existingCalendar = existingData.get(userId);
    if (!existingCalendar) continue;
    
    // セル備考をコピー
    for (const [key, existingCell] of existingCalendar.cells) {
      const newCell = newCalendar.cells.get(key);
      if (newCell && existingCell.note) {
        newCell.note = existingCell.note;
      }
    }
  }
  
  return newCalendars;
}
```

---

## 🔗 ScheduleControllerとの連携

**`js/controllers/ScheduleController.js` に追加**:

```javascript
/**
 * CSV取り込み処理
 */
async importCSV(files) {
  try {
    this.logger.info('CSV import started');
    
    // 1. CSVパース
    const csvService = new CSVService();
    const { users, weeklyPatterns } = await csvService.parseCSVFiles(files);
    
    // 2. 既存ユーザーチェック（Phase 2で実装予定の利用者確認画面）
    const hasExistingUsers = this.users.length > 0;
    if (hasExistingUsers) {
      this.logger.warn('Existing users found, will be overwritten');
    }
    
    // 3. 利用者マスタ更新
    this.users = users;
    this.storageService.saveUsers(users);
    
    // 4. 週間→月間展開
    const calendars = csvService.expandWeeklyToMonthly(
      weeklyPatterns,
      this.currentYearMonth,
      users
    );
    
    // 5. 既存スケジュールチェック
    const hasExistingSchedule = this.storageService.hasSchedule(
      this.currentYearMonth
    );
    
    if (hasExistingSchedule) {
      this.logger.warn('Existing schedule found, will be overwritten');
    }
    
    // 6. 備考を保持したまま上書き
    const mergedCalendars = csvService.mergeWithExistingNotes(
      calendars,
      this.currentYearMonth
    );
    
    // 7. 保存
    for (const [userId, calendar] of mergedCalendars) {
      this.calendars.set(userId, calendar);
    }
    this.storageService.saveSchedule(this.currentYearMonth, this.calendars);
    
    // 8. イベント発火
    this.emit('schedule:loaded', { yearMonth: this.currentYearMonth });
    this.emit('users:loaded', { users: this.users });
    
    this.logger.info('CSV import completed');
    return true;
    
  } catch (error) {
    this.logger.error('CSV import failed:', error);
    throw error;
  }
}
```

---

## 🧪 テスト方法

### 1. コンソールテスト

```javascript
// ブラウザコンソールで実行
const controller = window.app.controllers.schedule;

// テスト用CSVデータ
const testData = `
,青柳美秋,11:00\\n17:00,基本,071111,通所,\\0,通い,曜日指定,-,1,-,1,-,1,-
,青柳美秋,,基本,071131,宿泊,,小規模,曜日指定,-,1,1,-,-,1,1
`;

const blob = new Blob([testData], { type: 'text/csv;charset=shift-jis' });
const file = new File([blob], 'test.csv');

controller.importCSV([file]).then(() => {
  console.log('Import completed');
  console.log('Users:', controller.users);
  console.log('Calendars:', controller.calendars);
});
```

### 2. UI経由テスト

1. ブラウザで `http://localhost:8000` を開く
2. 「算定一覧を取り込む」ボタンをクリック
3. テスト用CSVファイルを選択
4. グリッドに予定が表示されることを確認
5. コンソールでログを確認

---

## 📝 実装完了の定義

以下がすべてクリアされたら完了:

- [ ] `CSVService.js` ファイル作成完了
- [ ] Shift_JIS読み込みが動作
- [ ] 週間パターン抽出が正しい
- [ ] 月間展開が正しい
- [ ] 宿泊期間調整が正しい
- [ ] `ScheduleController.importCSV()` 実装完了
- [ ] Toolbar経由でCSV取り込みが動作
- [ ] コンソールエラーなし
- [ ] グリッドに予定が表示される
- [ ] LocalStorageにデータが保存される

---

## 💡 実装のヒント

### エラーハンドリング

```javascript
try {
  // CSV処理
} catch (error) {
  if (error.message.includes('Shift_JIS')) {
    this.showError('CSVファイルの文字コードが不正です');
  } else if (error.message.includes('parse')) {
    this.showError('CSVファイルの形式が不正です');
  } else {
    this.showError('予期しないエラーが発生しました');
  }
}
```

### パフォーマンス最適化

```javascript
// 大量データ処理時はバッチ処理
const batchSize = 10;
for (let i = 0; i < users.length; i += batchSize) {
  const batch = users.slice(i, i + batchSize);
  // 処理
  await new Promise(resolve => setTimeout(resolve, 0)); // UI更新の余地
}
```

---

## 📚 参照ドキュメント

- 要件定義書_データ管理_v1.0.md（3.2〜3.5節）
- Excel入出力仕様書.md
- クラス設計書Phase1.md
- データモデル設計書_v3.0.md

---

**作成者**: Claude（設計担当）  
**最終更新**: 2025年11月15日  
**バージョン**: 1.0  
**ステータス**: 実装開始可能

---

# 実装ガイド_Phase1-A_CSVService.md - 補足追加

ドキュメントの最後に以下のセクションを追加してください：

---

## 📚 実装完了後の参考情報

### Phase 1-A 完了報告

Phase 1-Aの実装詳細、発見されたバグ、UI改善については、以下のドキュメントを参照してください：

**📄 Phase1-A完了報告.md**

このドキュメントには以下の情報が記載されています：

1. **実装完了サマリー**
   - 完了した機能一覧
   - 動作確認結果

2. **発見・修正したバグ（全5件）**
   - CSVパース（引用符内改行）
   - ID生成（引数型エラー）
   - StorageService（キー重複）
   - DateUtils（format引数未対応）
   - セルタイプ不一致（`am` → `dayStay`）

3. **CSV構造の仕様確定**
   - 利用者名の記載ルール
   - サービスコードの判定（上2桁）
   - 複数行の統合ルール（回数加算 vs OR結合）
   - RFC 4180準拠のCSVパース実装

4. **UI改善の詳細**
   - 横スクロール削減（列幅32px）
   - スクロール同期（定員ヘッダーとグリッド）
   - 行高さ最適化（1人あたり42px）

5. **技術的知見**
   - 学んだこと（RFC 4180、状態管理、キー命名規則など）
   - ベストプラクティス

6. **次フェーズへの引き継ぎ**
   - Phase 1-B（定員チェック）への準備
   - Phase 2（Excel入出力）への準備

---

### 要件定義書の更新

Phase 1-Aの実装完了により、以下の要件定義書が更新されました：

#### 📄 要件定義書_データ管理.md（v1.1）

**追加セクション**:
- **3.2.5 サービスコードの判定ルール**
  - 上2桁（06/07/08）で判定
  - 訪問（06）、通所（07）、宿泊（08）
  
- **3.2.6 複数行の統合ルール**
  - 訪問: 回数加算
  - 通所: OR結合
  - 宿泊: OR結合
  
- **3.2.7 CSVパースの実装詳細**
  - RFC 4180準拠
  - 引用符内改行の対応

#### 📄 要件定義書_UI.md（v1.1）

**追加セクション**:
- **1.5 スクロール同期**
  - JavaScriptでのスクロールイベント同期
  - 無限ループ防止のフラグ制御
  
- **1.6 グリッドサイズ仕様**
  - 列幅: 32px（最適化済み）
  - 行高さ: 通泊24px、訪問18px
  - フォントサイズ: 12px
  - 空セル対策

---

### データモデル設計書の修正

#### 📄 データモデル設計書_v3.0.md（v3.1）

**修正内容**:
- `cellType`の表記統一
  - 修正前: `"am" | "pm" | "visit"`
  - 修正後: `"dayStay" | "visit"`

**理由**:
Phase 0で設計変更されたが、ドキュメントに反映されていなかった。Phase 1-A実装中にバグとして発見。

---

### 実装時の注意事項（再掲）

Phase 1-Aの実装を通じて明らかになった重要なポイント：

#### 1. CSV処理
- **RFC 4180準拠が必須**: 単純な`split()`では不十分
- **状態管理が重要**: 利用者名が空の行の処理
- **型変換の安全化**: `parseInt() || 0`で必ず安全化

#### 2. データキー管理
- **prefix使用時の注意**: `${prefix}schedule_${month}`は重複の原因
- **正しい形式**: `${prefix}${month}`

#### 3. UI最適化
- **スクロール同期**: フラグで無限ループを防止
- **空要素の高さ**: `:empty::after`で不可視コンテンツ挿入
- **CSS box-sizing**: `border-box`で幅計算を簡単に

---

## 📝 改訂履歴（追記）

| 日付 | 版 | 変更内容 | 担当 |
|------|-----|----------|------|
| 2025-11-15 | 1.0 | 初版作成 | Claude |
| 2025-11-17 | 1.1 | 完了報告、要件定義書更新へのリンク追加 | Claude |

---

## 関連ドキュメント（更新）

### Phase 1-A関連
- **Phase1-A完了報告.md**: 実装の詳細記録 ★NEW
- **要件定義書_データ管理_v1.1.md**: CSV仕様確定版 ★UPDATED
- **要件定義書_UI_v1.1.md**: スクロール同期・サイズ仕様 ★UPDATED
- **データモデル設計書_v3.1.md**: セルタイプ表記修正 ★UPDATED

### Phase 1-B以降
- **実装ガイド_Phase1-B.md**: 次フェーズ（作成予定）
- **未確定項目リスト_v3.0.md**: 今後の決定事項