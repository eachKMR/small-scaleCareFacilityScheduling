# Phase 1-A 実装フィードバック（完全版）

**日付**: 2025年11月15日  
**フェーズ**: Phase 1-A（CSV取り込み機能）  
**ステータス**: ✅ 完了

---

## 1. 実装完了サマリー

### 完了した機能
- ✅ CSVファイル選択・読み込み（Shift_JIS対応）
- ✅ 週間パターン抽出（複数行統合、OR結合）
- ✅ 月間スケジュール展開（2025年11月、30日間）
- ✅ 宿泊期間調整（入→○→退）
- ✅ LocalStorage保存・読込
- ✅ グリッド表示（29名全員、訪問・通所・宿泊）
- ✅ 定員状況ヘッダー表示

### 動作確認結果
- **テストデータ**: 算定基礎_介護.csv（420行、29名）
- **インポート成功**: 29名全員
- **表示確認**: 訪問（数字）、通所（○）、宿泊（入/○/退）すべて正常表示
- **定員計算**: 正常動作（数値表示確認）

---

## 2. 発見・修正したバグ（全5件）

### バグ1: CSVパース - 引用符内改行の処理
**現象**:  
```csv
"サービス時間: 11:00
17:00"
```
のような引用符内改行で行が分割され、16列のはずが3列になる

**原因**:  
`String.split('\n')`が引用符を考慮せず機械的に分割

**解決策**:  
RFC 4180準拠の`_parseCSVText()`メソッドを実装。状態機械で引用符の開閉を追跡し、引用符内の改行を保持

**修正ファイル**: `CSVService.js` (120-180行)

---

### バグ2: ID生成 - 引数型エラー
**現象**:  
```
IdGenerator.userId() expects array, got number
```

**原因**:  
`IdGenerator.userId(index + 1)`と呼んでいたが、配列を期待していた

**解決策**:  
IdGeneratorへの依存を削除し、直接実装に変更
```javascript
const userId = `user${String(index + 1).padStart(3, '0')}`;
```

**修正ファイル**: `CSVService.js` (256行)

---

### バグ3: StorageService - キー重複
**現象**:  
LocalStorageのキーが`'schedule_schedule_2025-11'`となり、読込時に`'schedule_2025-11'`を参照してデータが見つからない

**原因**:  
```javascript
const key = `${this.prefix}schedule_${yearMonth}`;
```
`this.prefix`が既に`'schedule_'`を含むため重複

**解決策**:  
キー生成を`${this.prefix}${yearMonth}`に修正（6箇所）

**修正ファイル**: `StorageService.js` (96, 126, 152, 223, 234, 518行)

---

### バグ4: DateUtils - format引数未対応
**現象**:  
```javascript
DateUtils.formatDate(date, 'YYYY年MM月')
```
と呼んでも第2引数が無視され、常に`'YYYY-MM-DD'`形式で返る

**原因**:  
`formatDate(date)`の実装がformat引数を受け取っていなかった

**解決策**:  
- `formatDate(date, format='YYYY-MM-DD')`にシグネチャ変更
- string型日付のサポート追加
- カスタムフォーマット対応（YYYY, MM, DD置換）

**修正ファイル**: `DateUtils.js` (22-40行)

---

### バグ5: セルタイプ不一致
**現象**:  
- CSVService: `'dayStay'`でセル作成
- ScheduleGrid: `'am'`でセル取得
- 結果: セルが見つからず空表示

**原因**:  
Phase 0設計時の`'am'`/`'pm'`から`'dayStay'`への変更が不完全

**解決策**:  
ScheduleGrid.jsの2箇所で`'am'`→`'dayStay'`に修正
- 218行: `createCellElement()`のセルタイプ判定
- 367行: `handleCellClick()`のupdateCell呼び出し

**修正ファイル**: `ScheduleGrid.js` (218, 367行)

---

## 3. CSV構造の仕様確定

### 発見した実際のCSV構造

#### 利用者名の記載ルール
- **最初の行のみ**: 利用者名が記載される
- **2行目以降**: 空（次の利用者まで）
- **意味**: 名前が空の行は、直前の利用者の追加サービス行

例:
```csv
安藤敏子, ..., 061111, ..., 1000000  # 訪問（日曜のみ）
        , ..., 071111, ..., 0101010  # 通所（火木土）
        , ..., 081111, ..., 0001000  # 宿泊（木のみ）
吉田良子, ..., 071111, ..., 1111111  # 次の利用者
```

#### サービスコードの規則
実装で確定した仕様:
- **06xxxx**: 訪問介護等 → `visitPattern`
- **07xxxx**: 通所介護等 → `dayPattern`（通い）
- **08xxxx**: 短期入所等 → `stayPattern`（宿泊）

※ 上2桁で判定、下4桁は事業所コード等

#### 複数行の統合ルール
同じサービス種別（06/07/08）の複数行がある場合:

**訪問（06）**: 回数を加算
```
1行目: 1010000 (月1回、水1回)
2行目: 0101000 (火1回、木1回)
結果:  1111000 (月火水木各1回)
```

**通所（07）**: OR結合
```
1行目: 1010000 (月、水)
2行目: 0101000 (火、木)
結果:  1111000 (月火水木)
```

**宿泊（08）**: OR結合
```
1行目: 1000000 (月)
2行目: 0001000 (木)
結果:  1001000 (月、木)
```

---

## 4. 実装した主要ロジック

### 4.1 CSVパーサー（RFC 4180準拠）

```javascript
_parseCSVText(text) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let insideQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];
        
        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                currentField += '"';
                i++; // エスケープされた引用符をスキップ
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            currentRow.push(currentField);
            currentField = '';
        } else if (char === '\n' && !insideQuotes) {
            currentRow.push(currentField);
            if (currentRow.length > 0) rows.push(currentRow);
            currentRow = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }
    
    return rows;
}
```

### 4.2 複数行統合ロジック

```javascript
_extractUsersAndPatterns(rows) {
    const userMap = new Map();
    let currentUserName = null;
    
    for (const row of rows) {
        const userName = row[1];
        const serviceCode = row[4];
        const weekPattern = row.slice(9, 16);
        
        // 利用者名がある場合は新しい利用者
        if (userName && userName.trim() !== '') {
            currentUserName = userName.trim();
            // 初期化...
        }
        
        // サービスコードチェック
        const serviceCategory = serviceCode.slice(0, 2);
        if (!['06', '07', '08'].includes(serviceCategory)) continue;
        
        const pattern = userMap.get(currentUserName);
        
        // OR結合または加算
        if (serviceCategory === '06') {
            // 訪問: 回数加算
            weekPattern.forEach((v, idx) => {
                const current = parseInt(pattern.visitPattern[idx], 10) || 0;
                const newNum = parseInt(v, 10) || 0;
                pattern.visitPattern[idx] = String(current + newNum);
            });
        } else if (serviceCategory === '07') {
            // 通所: OR結合
            weekPattern.forEach((v, idx) => {
                if (v === '1' || v === '○' || pattern.dayPattern[idx] === '1') {
                    pattern.dayPattern[idx] = '1';
                }
            });
        }
        // ... 宿泊も同様
    }
}
```

---

## 5. 残課題・改善提案

### 高優先度
- [x] **UI改善**: 横スクロール削減（33列を画面内に収める）✅完了
- [x] **スクロール同期**: 定員ヘッダーとグリッドの日付列を同期 ✅完了
- [x] **行高さ最適化**: 20名が一度に見えるよう圧縮 ✅完了
- [ ] **エラーハンドリング**: 不正なCSVフォーマットの検証強化
- [ ] **パフォーマンス**: 大量データ（100名以上）の動作確認

### 中優先度
- [ ] **ドキュメント更新**: `要件定義書_データ管理.md`にサービスコード仕様を追記
- [ ] **テストケース**: 単体テスト追加（CSVService）
- [ ] **上書き確認**: インポート時の既存データ確認ダイアログ（Phase 2で実装予定）

### 低優先度
- [ ] **プログレス表示**: 大きなCSVファイルのインポート進捗
- [x] **ログ改善**: デバッグログの削除 ✅完了

---

## 6. UI改善の詳細

### 6.1 横スクロール削減（完了）

**変更内容**:
- 列幅を50px → 32pxに縮小
- 利用者名列を120px → 100pxに縮小
- 合計幅: 1124px（1366px画面で余裕を持って表示可能）

**修正ファイル**: `css/components.css`
- `.header-cell`: width 32px
- `.schedule-cell`: width 32px
- `.user-name-cell`: width 100px
- `.capacity-label-cell`: width 100px
- `.capacity-date-cell`: width 32px

### 6.2 スクロール同期（完了）

**課題**: 定員ヘッダーとグリッドが別コンテナで、日付列がずれる

**解決策**: JavaScriptでスクロールイベントを同期
```javascript
setupScrollSync(capacityContainer, gridContainer) {
    let isCapacityScrolling = false;
    let isGridScrolling = false;
    
    capacityContainer.addEventListener('scroll', () => {
        if (isGridScrolling) {
            isGridScrolling = false;
            return;
        }
        isCapacityScrolling = true;
        gridContainer.scrollLeft = capacityContainer.scrollLeft;
    });
    
    gridContainer.addEventListener('scroll', () => {
        if (isCapacityScrolling) {
            isCapacityScrolling = false;
            return;
        }
        isGridScrolling = true;
        capacityContainer.scrollLeft = gridContainer.scrollLeft;
    });
}
```

**修正ファイル**: `js/components/App.js`

**CSS調整**:
- `#capacity-indicator`: overflow-x: auto
- `#schedule-grid`: overflow-x: auto, overflow-y: auto
- 両テーブル: width: max-content（コンテンツ幅に合わせる）

### 6.3 行高さ最適化（完了）

**目標**: 20名を一度に表示（1080px画面想定）

**変更前**:
- 定員ヘッダー: 30px
- 通泊行: 40px
- 訪問行: 30px
- **1人あたり**: 70px（10人で700px）

**変更後**:
- 定員ヘッダー: 22px
- 通泊行: 24px（min-height指定で固定）
- 訪問行: 18px（min-height指定で固定）
- **1人あたり**: 42px（20人で840px）

**空セル対策**:
```css
.schedule-cell:empty::after {
    content: '\00a0'; /* non-breaking space */
    visibility: hidden;
}
```
訪問が0の行でも高さが維持される

**フォントサイズ調整**:
- セル: 13px → 12px
- 利用者名: 13px → 12px
- 定員記号: 16px → 13px
- 定員数値: 12px → 10px

**修正ファイル**: `css/components.css`

---

## 7. 技術的知見

### 学んだこと
1. **RFC 4180の重要性**: CSVは単純に見えて奥が深い（引用符、改行、エスケープ）
2. **状態管理の複雑さ**: 利用者名が空の行を処理するため、状態変数（currentUserName）が必須
3. **キー命名規則**: prefix使用時の重複に注意（`${prefix}users`は良いが、`${prefix}schedule_${month}`は悪い）
4. **型変換の罠**: `parseInt()`の結果は必ず`|| 0`で安全化
5. **スクロール同期**: 2つのコンテナのスクロールをフラグで制御（無限ループ防止）
6. **CSS box-sizing**: border-boxで幅計算が簡単に（border含む）
7. **空要素の高さ**: `:empty::after`擬似要素で不可視コンテンツを挿入

### ベストプラクティス
- **小さく分割**: `_parseCSVText()`, `_extractUsersAndPatterns()`, `expandWeeklyToMonthly()`の3段階に分離
- **デバッグログの活用**: 問題特定に`console.log()`が非常に有効（完成後は削除）
- **段階的コミット**: 各バグ修正ごとにコミットすべきだった（今回は最後に一括）
- **min/max両指定**: CSSで`width`, `min-width`, `max-width`を全て指定して確実に固定
- **イベント同期のフラグ**: 相互イベントの無限ループをフラグで防止

---

## 7. 次フェーズへの引き継ぎ

### Phase 1-B（定員チェック）への準備
- ✅ ScheduleCalendar.getCell()が正常動作
- ✅ CapacityCheckController.calculateDailyCapacity()が実装済み
- ✅ 定員ヘッダーに数値表示確認済み

### Phase 2（Excel入出力）への準備
- ⚠️ CSVとExcelのフォーマット差異を要調査
- ⚠️ ExcelServiceの実装方針確定が必要

---

**作成者**: GitHub Copilot  
**レビュー**: 未実施  
**承認**: 未実施
