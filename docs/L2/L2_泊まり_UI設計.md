# L2_泊まり_UI設計

**作成日**: 2025年11月23日  
**カテゴリ**: 第2層 - セクション別  
**バージョン**: 4.0  
**更新日**: 2025年12月31日

---

## 📖 このドキュメントについて

このドキュメントは、**泊まりセクションのUI設計**を定義します。

### v4.0での主要な変更

1. **10行構成に変更**
   - 未割当行（1行）+ 居室行（9行）

2. **未割当行の設計**
   - 通いUIで設定された泊まり予約（roomId = null）を縦積み表示
   - 可変高さ

3. **居室行の設計**
   - 固定2コンテンツ高
   - 入所=下半分、退所=上半分、連泊=中央配置

4. **記号削除**
   - 入・○・退を廃止
   - 苗字のみ表示

5. **ドラッグ&ドロップ**
   - 未割当→居室：部屋割り当て
   - 居室→未割当：割り当て解除
   - 居室→居室：部屋変更

### 対象読者

- 泊まりセクションの実装担当者
- UIデザイナー
- テスト担当者

### 読了後に理解できること

- 10行構成のグリッド構造
- 未割当行の縦積み表示
- 居室行の2コンテンツ高設計
- ドラッグ&ドロップ操作
- **縦軸整列の設計方法**

### 設計の前提

- **L2_泊まり_データ構造.md v2.0** のTomariReservationクラス（roomId null許可）
- **L3_UI_統合UI設計.md v3.0** のカレンダーヘッダー設計
- **L1_技術_実装制約.md** のUI/UX規約に準拠

---

## 1. 画面構成

### 1.1 全体レイアウト

```
┌─────────────────────────────────────────┐
│ [泊まりセクション]                       │
├─────────────────────────────────────────┤
│ 定員表示                                 │
│ 本日: 7/9人  明日: 9/9人  明後日: 6/9人 │
├─────────────────────────────────────────┤
│ 月別予定表（グリッド）                   │
│                                          │
│          1   2   3   4   5   6   7      │
│         月  火  水  木  金  土  日      │
│ 【未割当】 山    田    鈴    -    -    - │ ← 縦積み、可変高さ
│          佐                              │
│ 1号室     -    山    山    -    田   田  │ ← 2コンテンツ高固定
│ 2号室    内   内   内   内   内   内  内│
│ 3号室     -    木    -    花   花   花   - │
│ ...                                      │
└─────────────────────────────────────────┘
```

**重要な変更点**:
- **未割当行**: 通いUIで「泊まる」と設定されたが、まだ部屋が決まっていない人
- **居室行**: 部屋が割り当てられた人
- **記号なし**: 苗字のみ表示

---

### 1.2 HTML構造

```html
<div id="tomari-section" class="section">
  <!-- 定員表示 -->
  <div class="capacity-display">
    <div class="capacity-item">
      <span class="label">本日:</span>
      <span id="today-count" class="count">7</span>
      <span class="max">/9人</span>
    </div>
    <div class="capacity-item">
      <span class="label">明日:</span>
      <span id="tomorrow-count" class="count">9</span>
      <span class="max">/9人</span>
    </div>
    <div class="capacity-item">
      <span class="label">明後日:</span>
      <span id="day-after-tomorrow-count" class="count">6</span>
      <span class="max">/9人</span>
    </div>
  </div>
  
  <!-- 月別予定表 -->
  <div class="schedule-grid-container">
    <table id="tomari-grid" class="schedule-grid">
      <thead>
        <tr>
          <th class="room-header">居室</th>
          <th class="date-header" data-date="2025-11-01">
            <div class="date">1</div>
            <div class="day">月</div>
          </th>
          <!-- ...他の日付 -->
        </tr>
      </thead>
      <tbody>
        <!-- 未割当行 -->
        <tr data-room-id="unassigned" class="unassigned-row">
          <td class="room-cell">【未割当】</td>
          <td class="schedule-cell unassigned-cell" data-date="2025-11-01">
            <div class="cell-content">
              <div class="user-item" draggable="true" data-user-id="user_yamada">山</div>
              <div class="user-item" draggable="true" data-user-id="user_sato">佐</div>
            </div>
          </td>
          <!-- ...他の日付 -->
        </tr>
        
        <!-- 居室行 -->
        <tr data-room-id="room01" class="room-row">
          <td class="room-cell">1号室</td>
          <td class="schedule-cell room-cell" data-room-id="room01" data-date="2025-11-01">
            <div class="cell-content">
              <div class="upper-half"></div>
              <div class="lower-half">山</div>
            </div>
          </td>
          <!-- ...他の日付 -->
        </tr>
        <!-- ...他の居室（room02～room09） -->
      </tbody>
    </table>
  </div>
</div>
```

---

## 2. グリッド表示

### 2.1 グリッド構造

#### 2.1.1 10行構成

```
行番号  種別        内容
──────────────────────────────
1       未割当行    roomId = null の予約
2-10    居室行      room01～room09
```

#### 2.1.2 未割当行の特徴

- **可変高さ**: 予約数に応じて自動調整
- **縦積み表示**: 同じ日に複数人いる場合は縦に並べる
- **ドラッグ可能**: 各ユーザーアイテムをドラッグして居室に割り当て可能

```css
.unassigned-cell {
  height: auto;  /* 可変高さ */
  min-height: var(--cell-min-height);
}

.user-item {
  display: block;
  padding: 2px 4px;
  margin: 2px 0;
  background: #f0f0f0;
  border-radius: 4px;
  cursor: move;
}
```

#### 2.1.3 居室行の特徴

- **固定2コンテンツ高**: 常に一定の高さ
- **上半分/下半分**: 入所・退所の視覚的表現

```css
.room-cell {
  height: calc(var(--cell-min-height) * 2);  /* 固定2コンテンツ高 */
}

.cell-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.upper-half,
.lower-half {
  flex: 1;  /* 上下均等に分割 */
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

### 2.2 セル内の表現

#### 2.2.1 未割当セル

```html
<!-- 例：11月1日に山田さんと佐藤さんが未割当 -->
<td class="schedule-cell unassigned-cell" data-date="2025-11-01">
  <div class="cell-content">
    <div class="user-item" draggable="true" data-user-id="user_yamada">山</div>
    <div class="user-item" draggable="true" data-user-id="user_sato">佐</div>
  </div>
</td>
```

#### 2.2.2 居室セル（入所日）

```html
<!-- 例：11月1日に山田さんが入所 -->
<td class="schedule-cell room-cell" data-date="2025-11-01">
  <div class="cell-content">
    <div class="upper-half"></div>  <!-- 上半分は空 -->
    <div class="lower-half">山</div> <!-- 下半分に苗字 -->
  </div>
</td>
```

#### 2.2.3 居室セル（退所日）

```html
<!-- 例：11月3日に山田さんが退所 -->
<td class="schedule-cell room-cell" data-date="2025-11-03">
  <div class="cell-content">
    <div class="upper-half">山</div>  <!-- 上半分に苗字 -->
    <div class="lower-half"></div>   <!-- 下半分は空 -->
  </div>
</td>
```

#### 2.2.4 居室セル（連泊）

```html
<!-- 例：11月2日に山田さんが連泊中 -->
<td class="schedule-cell room-cell" data-date="2025-11-02">
  <div class="cell-content">
    <div class="upper-half"></div>   <!-- 上半分は空 -->
    <div class="lower-half">山</div>  <!-- 下半分に苗字（中央配置） -->
  </div>
</td>
```

**注意**: ユーザーの確認により、連泊時は中央配置にします。

#### 2.2.5 居室セル（同日入れ替わり）

```html
<!-- 例：11月4日に木村さん退所、花田さん入所 -->
<td class="schedule-cell room-cell" data-date="2025-11-04">
  <div class="cell-content">
    <div class="upper-half">木</div>  <!-- 上半分に退所者 -->
    <div class="lower-half">花</div>  <!-- 下半分に入所者 -->
  </div>
</td>
```

---

## 3. インタラクション

### 3.1 ドラッグ&ドロップ

#### 3.1.1 未割当→居室（部屋割り当て）

```
操作: 未割当行の「山」を1号室の11月1日セルにドラッグ

Before:
【未割当】 11/1: [山]
1号室     11/1: [空]

After:
【未割当】 11/1: [空]
1号室     11/1: [下:山]  ← 下半分に表示
```

**処理**:
```javascript
function handleDrop(event) {
  const userId = event.dataTransfer.getData('userId');
  const targetRoomId = event.target.dataset.roomId;
  const targetDate = event.target.dataset.date;
  
  // TomariReservationのroomIdを更新
  const reservation = findReservation(userId, targetDate);
  reservation.roomId = targetRoomId;
  
  // UI更新
  rerenderGrid();
}
```

#### 3.1.2 居室→未割当（割り当て解除）

```
操作: 1号室の「山」を未割当行にドラッグ

Before:
【未割当】 11/1: [空]
1号室     11/1: [下:山]

After:
【未割当】 11/1: [山]
1号室     11/1: [空]
```

**処理**:
```javascript
reservation.roomId = null;  // 未割当に戻す
```

#### 3.1.3 居室→居室（部屋変更）

```
操作: 1号室の「山」を2号室にドラッグ

Before:
1号室     11/1: [下:山]
2号室     11/1: [空]

After:
1号室     11/1: [空]
2号室     11/1: [下:山]
```

**処理**:
```javascript
reservation.roomId = newRoomId;  // 部屋変更
```

---

### 3.2 ドラッグ&ドロップの制約

#### 3.2.1 期間途中は変更不可

```
NG: 11/1～11/3の予約の11/2だけ移動
→ エラー: 「期間の途中は変更できません」
```

#### 3.2.2 重複チェック

```
NG: 既に埋まっている部屋に割り当て
→ エラー: 「この部屋は既に使用中です」
```

---

## 4. 定員表示と視覚化

### 4.1 定員表示

**変更なし**（v3.0から継続）

```html
<div class="capacity-display">
  <div class="capacity-item">
    <span class="label">本日:</span>
    <span id="today-count" class="count">7</span>
    <span class="max">/9人</span>
  </div>
  <!-- 明日、明後日も同様 -->
</div>
```

### 4.2 カラーグラデーション

**変更なし**（L1_制約ゲーム_全体設計.mdに従う）

---

## 5. 縦軸整列の設計

### 5.1 CSS変数の使用

**変更なし**（v3.0から継続）

```css
:root {
  --label-column-width: 80px;
  --date-cell-width: clamp(35px, calc((100vw - 80px - 30px) / 31), 50px);
  --cell-min-height: 30px;
}

.schedule-grid {
  table-layout: fixed;
  width: 100%;
}

.room-header {
  width: var(--label-column-width);
}

.date-header {
  width: var(--date-cell-width);
}
```

### 5.2 高さの設計

```css
/* 未割当行: 可変高さ */
.unassigned-row .schedule-cell {
  height: auto;
  min-height: var(--cell-min-height);
}

/* 居室行: 固定2コンテンツ高 */
.room-row .schedule-cell {
  height: calc(var(--cell-min-height) * 2);
}
```

---

## 6. まとめ

### 6.1 v4.0の主な変更点

| 項目 | v3.0 | v4.0 |
|------|------|------|
| 行構成 | 9行（居室のみ） | **10行（未割当1 + 居室9）** |
| 記号 | 入・○・退 | **なし（苗字のみ）** |
| 居室セル | 固定高さ | **固定2コンテンツ高** |
| 未割当行 | なし | **縦積み、可変高さ** |
| 操作 | クリック | **ドラッグ&ドロップ** |

---

### 6.2 設計の意図

1. **未割当行の導入**
   - 通いUIで「泊まる」と決めた後、泊まりUIで部屋を割り当てる業務フローに対応

2. **記号の削除**
   - 入・○・退は不要（セルの位置で入所/連泊/退所を表現）
   - 苗字のみでシンプルに

3. **2コンテンツ高**
   - 同日入れ替わりに対応（上半分退所、下半分入所）

4. **ドラッグ&ドロップ**
   - 直感的な部屋割り当て操作

---

### 6.3 実装の優先順位

**Phase 1（必須）**:
- ✅ 10行グリッド表示
- ✅ 未割当行の縦積み
- ✅ 居室行の2コンテンツ高
- ✅ ドラッグ&ドロップ
- ✅ 縦軸整列

**Phase 2（拡張）**:
- ⏭️ 未割当行のソート（日付順、名前順）
- ⏭️ 未割当行のフィルタリング

---

## 📚 次に読むべきドキュメント

このドキュメントを読了したら、以下のドキュメントに進んでください。

### 関連ドキュメント

- **L2_泊まり_ロジック設計.md v2.0** - ドラッグ&ドロップロジック
- **L3_UI_統合UI設計.md v3.0** - カレンダーヘッダー、全体レイアウト
- **L2_泊まり_データ構造.md v2.0** - TomariReservationの仕様（roomId null許可）

---

## 📝 参考資料

- L2_泊まり_データ構造.md v2.0（データ構造）
- L3_UI_統合UI設計.md v3.0（カレンダーヘッダー）
- L1_技術_実装制約.md（UI/UX規約）
- CHECKLIST_設計レビュー.md（インタラクションの詳細記述）

---

## 📅 更新履歴

| 日付 | バージョン | 変更内容 | 担当 |
|------|----------|---------|------|
| 2025-11-23 | 1.0 | 初版作成 | Claude |
| 2025-11-23 | 2.0 | 詳細設計追加 | Claude |
| 2025-11-29 | 3.0 | 縦軸整列追加、スリム化 | Claude |
| 2025-12-31 | 4.0 | 未割当行、2コンテンツ高、D&D追加 | Claude |

---

**最終更新**: 2025年12月31日  
**次回更新予定**: Phase 1実装中のフィードバック反映時

---

## ⚠️ 設計チェックリスト

このドキュメントの品質チェック（v4.0）：

- [x] セクション固有の内容に特化している
- [x] 縦軸整列の設計が詳細に記述されている
- [x] CSS変数の使用が明記されている
- [x] すべてのインタラクションが具体的に記述されている
- [x] 未割当行の縦積み表示が詳細
- [x] 2コンテンツ高の設計が明確
- [x] ドラッグ&ドロップ操作が詳細

---

**このドキュメントを読了したら、INDEX_ドキュメント構成.md に戻り、次のドキュメントに進んでください。**