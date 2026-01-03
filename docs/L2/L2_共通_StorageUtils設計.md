# L2_共通_StorageUtils設計

**作成日**: 2026年01月03日  
**カテゴリ**: 第2層 - 共通  
**バージョン**: 1.0

---

## 📖 このドキュメントについて

このドキュメントは、**StorageUtilsクラスの詳細実装仕様**をまとめたものです。

### 対象読者

- **GitHub Copilot Agent**（実装担当）
- コードレビュー担当者

### このドキュメントの位置づけ

```
L1_技術_実装制約.md
  ↓ 「StorageUtilsを使え」というルール
L2_共通_StorageUtils設計.md（このドキュメント）
  ↓ 詳細な実装仕様
実装（GitHub Copilot）
```

### 前提条件

このドキュメントを読む前に、以下を読了してください：
- **L1_技術_実装制約.md** セクション7（localStorage使用規約）

---

## 1. StorageUtilsクラス仕様

### 1.1 概要

`StorageUtils` は、localStorage への読み書きを一元管理するユーティリティクラスです。

**責務**:
- キー管理の一元化（PREFIX管理）
- エラーハンドリングの統一
- データマイグレーションの透過的実行

---

### 1.2 PREFIX仕様

#### 定義

```javascript
class StorageUtils {
  static PREFIX = 'projectB_';  // 名前空間プレフィックス
}
```

#### 動作

| メソッド呼び出し | 実際のlocalStorageキー |
|----------------|---------------------|
| `save('users', data)` | `projectB_users` |
| `load('rooms')` | `projectB_rooms` |
| `remove('staff')` | `projectB_staff` |

**重要**: メソッドを呼び出す側は、PREFIXを**意識しない**。

---

### 1.3 メソッド仕様

#### save(key, data)

**用途**: データを保存

**シグネチャ**:
```javascript
/**
 * データを保存
 * @param {string} key - キー（プレフィックスなし）
 * @param {any} data - 保存するデータ（JSON.stringify可能なもの）
 * @throws {Error} JSON.stringify失敗、localStorage容量超過
 */
static save(key, data)
```

**実装例**:
```javascript
static save(key, data) {
  try {
    const fullKey = this.PREFIX + key;
    const json = JSON.stringify(data);
    localStorage.setItem(fullKey, json);
    console.log(`StorageUtils.save: ${fullKey}`);
  } catch (error) {
    console.error(`StorageUtils.save error [${key}]:`, error);
    throw error;
  }
}
```

**使用例**:
```javascript
const users = [
  { userId: 'user001', name: '山田太郎' }
];
StorageUtils.save('users', users);
// → localStorage['projectB_users'] = '[{"userId":"user001","name":"山田太郎"}]'
```

**エラーケース**:
- データが循環参照 → JSON.stringify エラー
- localStorage容量超過（5～10MB） → QuotaExceededError

---

#### load(key, defaultValue)

**用途**: データを読み込み

**シグネチャ**:
```javascript
/**
 * データを読み込み
 * @param {string} key - キー（プレフィックスなし）
 * @param {any} defaultValue - デフォルト値（データがない場合に返す）
 * @returns {any} - 読み込んだデータ（なければdefaultValue）
 */
static load(key, defaultValue = null)
```

**実装例**:
```javascript
static load(key, defaultValue = null) {
  try {
    const fullKey = this.PREFIX + key;
    const json = localStorage.getItem(fullKey);
    
    if (json === null) {
      return defaultValue;
    }
    
    return JSON.parse(json);
  } catch (error) {
    console.error(`StorageUtils.load error [${key}]:`, error);
    return defaultValue;
  }
}
```

**使用例**:
```javascript
// データあり
const users = StorageUtils.load('users', []);
// → [{ userId: 'user001', name: '山田太郎' }]

// データなし（初回起動）
const users = StorageUtils.load('users', []);
// → []（defaultValueが返る）
```

**エラーケース**:
- JSON.parse エラー → defaultValueを返す
- データが不正（壊れている） → defaultValueを返す

---

#### remove(key)

**用途**: データを削除

**シグネチャ**:
```javascript
/**
 * データを削除
 * @param {string} key - キー（プレフィックスなし）
 */
static remove(key)
```

**実装例**:
```javascript
static remove(key) {
  const fullKey = this.PREFIX + key;
  localStorage.removeItem(fullKey);
  console.log(`StorageUtils.remove: ${fullKey}`);
}
```

**使用例**:
```javascript
StorageUtils.remove('users');
// → localStorage['projectB_users'] を削除
```

---

#### clear()

**用途**: プロジェクトBのすべてのデータを削除

**シグネチャ**:
```javascript
/**
 * すべてのプロジェクトBデータを削除
 * @returns {number} 削除したキーの数
 */
static clear()
```

**実装例**:
```javascript
static clear() {
  const keys = Object.keys(localStorage);
  const projectKeys = keys.filter(k => k.startsWith(this.PREFIX));
  
  projectKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log(`StorageUtils.clear: ${projectKeys.length}件削除`);
  return projectKeys.length;
}
```

**使用例**:
```javascript
const count = StorageUtils.clear();
// → プロジェクトBのすべてのデータを削除
// console: "StorageUtils.clear: 3件削除"
```

**用途**: 
- 開発・デバッグ時のリセット
- ユーザーが「すべてのデータをクリア」を選択した場合

---

## 2. データマイグレーション機能

### 2.1 背景と目的

#### 問題の発生経緯

開発途中でPREFIX（`projectB_`）を追加したため、以下の問題が発生：

```
localStorage:
├─ users          ← 旧キー（8名のデータ）
├─ rooms          ← 旧キー（4室のデータ）
├─ projectB_users ← 新キー（空）
└─ projectB_rooms ← 新キー（9室のデータ）

StorageUtils.load('users')
→ localStorage['projectB_users'] を読む
→ [] が返る
→ 「利用者が登録されていません」
```

#### 解決方針

アプリ起動時に自動で旧データを新キーに移行する。

**重要な要件**:
1. **透過的**: ユーザーは移行を意識しない
2. **冪等性**: 何度実行しても結果が同じ
3. **安全性**: 既存データを上書きしない

---

### 2.2 migrate() メソッド仕様

#### シグネチャ

```javascript
/**
 * 旧キーから新キーにデータを移行
 * 初回起動時に1回だけ実行される
 * 
 * @returns {Object} { migrated: boolean, keys?: string[], reason?: string }
 *   - migrated: true = 移行実行, false = スキップ
 *   - keys: 移行したキーのリスト（migratedがtrueの場合）
 *   - reason: スキップ理由（migratedがfalseの場合）
 */
static migrate()
```

---

#### 実装仕様

```javascript
static migrate() {
  const migrationKey = this.PREFIX + 'migrated';
  
  // 既に移行済みならスキップ
  if (localStorage.getItem(migrationKey) === 'true') {
    console.log('✅ データ移行済み（スキップ）');
    return { migrated: false, reason: 'already_migrated' };
  }
  
  console.log('🔄 データ移行開始...');
  
  // 移行対象の旧キー一覧
  const oldKeys = ['users', 'rooms', 'staff'];
  const migratedKeys = [];
  
  oldKeys.forEach(oldKey => {
    const oldData = localStorage.getItem(oldKey);
    
    if (oldData !== null) {
      const newKey = this.PREFIX + oldKey;
      const existingData = localStorage.getItem(newKey);
      
      // 新キーが空 or 存在しない場合のみ移行
      if (!existingData || existingData === '[]' || existingData === '{}') {
        localStorage.setItem(newKey, oldData);
        migratedKeys.push(oldKey);
        console.log(`  ✓ ${oldKey} → ${newKey} 移行完了`);
      } else {
        console.log(`  ⏭️ ${newKey} は既にデータあり（スキップ）`);
      }
    } else {
      console.log(`  ⏭️ ${oldKey} にデータなし（スキップ）`);
    }
  });
  
  // 移行完了フラグを保存
  localStorage.setItem(migrationKey, 'true');
  
  if (migratedKeys.length > 0) {
    console.log(`✅ データ移行完了: ${migratedKeys.join(', ')}`);
    return { migrated: true, keys: migratedKeys };
  } else {
    console.log('✅ データ移行完了（移行対象なし）');
    return { migrated: true, keys: [] };
  }
}
```

---

#### 移行対象キー

| 旧キー | 新キー | 説明 |
|--------|--------|------|
| `users` | `projectB_users` | 利用者マスタ |
| `rooms` | `projectB_rooms` | 居室マスタ |
| `staff` | `projectB_staff` | 職員マスタ |

**注**: トランザクションデータ（予定データ）は対象外（月ごとにキーが異なるため）

---

#### 移行フローチャート

```
アプリ起動
  ↓
StorageUtils.migrate() 呼び出し
  ↓
projectB_migrated フラグをチェック
  ↓
  ├─ 'true' → スキップ（既に移行済み）
  │            { migrated: false, reason: 'already_migrated' }
  │
  └─ null → 移行処理を実行
       ↓
     旧キー（users, rooms, staff）を検索
       ↓
     各キーについて:
       ├─ データあり かつ 新キーが空 → 移行
       │    localStorage.setItem(newKey, oldData)
       │
       ├─ データあり かつ 新キーに既存データ → スキップ
       │
       └─ データなし → スキップ
       ↓
     projectB_migrated = 'true' を保存
       ↓
     { migrated: true, keys: [...] }
```

---

### 2.3 呼び出し方法

#### main.js での呼び出し

```javascript
// main.js
class App {
  async init() {
    console.log('Application initializing...');
    
    // 🆕 データ移行を最初に実行
    const migrationResult = StorageUtils.migrate();
    
    if (migrationResult.migrated && migrationResult.keys.length > 0) {
      console.log('📝 旧データを移行しました:', migrationResult.keys);
    }
    
    // マスターデータ初期化
    this.masterData = new MasterDataManager();
    
    // ... 以下既存のコード
  }
}
```

**重要**: 
- `migrate()` は **同期関数**（async不要）
- MasterDataManager初期化の**前**に呼び出す
- 戻り値をログ出力すると、移行状況が分かりやすい

---

### 2.4 動作例

#### 1回目の起動（旧データあり）

```
console:
Application initializing...
🔄 データ移行開始...
  ✓ users → projectB_users 移行完了
  ✓ rooms → projectB_rooms 移行完了
  ⏭️ projectB_staff は既にデータあり（スキップ）
✅ データ移行完了: users, rooms
📝 旧データを移行しました: ["users", "rooms"]
```

#### 2回目以降の起動

```
console:
Application initializing...
✅ データ移行済み（スキップ）
```

---

### 2.5 resetMigration() メソッド（デバッグ用）

#### シグネチャ

```javascript
/**
 * マイグレーションをリセット（開発・テスト用）
 * 本番環境では使用しない
 */
static resetMigration()
```

#### 実装例

```javascript
static resetMigration() {
  const migrationKey = this.PREFIX + 'migrated';
  localStorage.removeItem(migrationKey);
  console.log('⚠️ マイグレーションフラグをリセットしました');
}
```

#### 使用例

```javascript
// 開発者コンソールから実行
StorageUtils.resetMigration();
// → 次回起動時にマイグレーションが再実行される
```

**用途**: マイグレーション機能のテスト・デバッグ

---

### 2.6 テスト方法

#### 手順1: マイグレーションをリセット

```javascript
// 開発者コンソール（F12）で実行
StorageUtils.resetMigration();
```

#### 手順2: 旧データを作成

```javascript
// テスト用の旧データを作成
localStorage.setItem('users', '[{"userId":"test001","name":"テスト太郎"}]');
localStorage.setItem('rooms', '[{"roomId":"room01","name":"1号室"}]');
```

#### 手順3: ページをリロード

```
ブラウザでページをリロード（F5）
→ console に移行ログが表示される
```

**期待される出力**:
```
🔄 データ移行開始...
  ✓ users → projectB_users 移行完了
  ✓ rooms → projectB_rooms 移行完了
  ⏭️ staff にデータなし（スキップ）
✅ データ移行完了: users, rooms
```

#### 手順4: データ確認

```javascript
// 移行後のデータを確認
localStorage.getItem('projectB_users');
// → '[{"userId":"test001","name":"テスト太郎"}]'
```

#### 手順5: 冪等性確認

```
もう一度リロード
→ 「✅ データ移行済み（スキップ）」と表示される
```

---

### 2.7 重要な仕様

#### 冪等性（べきとうせい）

**定義**: 何度実行しても結果が同じ

**実装方法**:
- `projectB_migrated` フラグで制御
- フラグが `'true'` ならスキップ

**テスト方法**:
```javascript
// 1回目
StorageUtils.migrate();
// → { migrated: true, keys: ['users', 'rooms'] }

// 2回目
StorageUtils.migrate();
// → { migrated: false, reason: 'already_migrated' }
```

---

#### 安全性

**ルール**: 新キーに既存データがある場合は上書きしない

```javascript
if (!existingData || existingData === '[]' || existingData === '{}') {
  // 空の場合のみ移行
  localStorage.setItem(newKey, oldData);
}
```

**理由**: ユーザーが手動で新データを入力していた場合、それを保護する

---

#### 旧データの保持

**ルール**: 旧データは削除しない

**理由**:
1. 念のためバックアップとして残す
2. 容量的に問題ない（数KB程度）
3. 手動削除は可能

**手動削除の方法**（オプション）:
```javascript
// 移行確認後、手動で削除可能
localStorage.removeItem('users');
localStorage.removeItem('rooms');
localStorage.removeItem('staff');
```

---

## 3. エラーハンドリング

### 3.1 JSON.stringify エラー

**発生ケース**:
- データが循環参照を含む
- データにundefinedが含まれる

**対処**:
```javascript
try {
  const json = JSON.stringify(data);
  localStorage.setItem(fullKey, json);
} catch (error) {
  console.error(`StorageUtils.save error [${key}]:`, error);
  throw error;  // 上位に投げる
}
```

**上位での処理**:
```javascript
try {
  StorageUtils.save('users', users);
} catch (error) {
  alert('データの保存に失敗しました');
}
```

---

### 3.2 localStorage 容量超過

**発生ケース**:
- データサイズが5～10MBを超える

**エラー名**: `QuotaExceededError`

**対処**:
```javascript
try {
  localStorage.setItem(fullKey, json);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    console.error('localStorage容量超過');
    // 古いデータを削除するなどの対処
  }
  throw error;
}
```

---

### 3.3 JSON.parse エラー

**発生ケース**:
- データが不正（壊れている）
- 手動で編集された

**対処**:
```javascript
try {
  return JSON.parse(json);
} catch (error) {
  console.error(`StorageUtils.load error [${key}]:`, error);
  return defaultValue;  // エラー時はデフォルト値を返す
}
```

**重要**: エラーを投げずに、デフォルト値を返す（アプリを起動可能にする）

---

## 4. Phase 2 以降の拡張

### 4.1 サーバーへの移行

将来的にサーバー連携が必要になった場合：

```javascript
// Phase 2: サーバーへの移行
static async migrateToServer() {
  const data = {
    users: this.load('users', []),
    rooms: this.load('rooms', []),
    staff: this.load('staff', [])
  };
  
  // サーバーにPOST
  const response = await fetch('/api/migrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (response.ok) {
    console.log('サーバーへの移行完了');
  }
}
```

---

### 4.2 バージョン管理

データ構造が変わった場合のマイグレーション：

```javascript
static migrate() {
  const version = this.load('version', 1);
  
  if (version < 2) {
    // v1 → v2 マイグレーション
    this.migrateV1ToV2();
    this.save('version', 2);
  }
  
  if (version < 3) {
    // v2 → v3 マイグレーション
    this.migrateV2ToV3();
    this.save('version', 3);
  }
}
```

---

## 5. まとめ

### 5.1 このドキュメントで定義したこと

```
✅ 定義したこと
├─ StorageUtilsクラスの完全な実装仕様
│   ├─ PREFIX仕様
│   ├─ save/load/remove/clearメソッド
│   └─ エラーハンドリング
│
├─ データマイグレーション機能
│   ├─ migrate()メソッドの詳細仕様
│   ├─ 移行フローチャート
│   ├─ 呼び出し方法（main.js）
│   ├─ テスト方法
│   └─ 冪等性・安全性の保証
│
└─ Phase 2以降の拡張案
    ├─ サーバー移行
    └─ バージョン管理
```

---

### 5.2 重要なポイント

1. **PREFIX管理**: `projectB_` を一元管理
2. **エラーハンドリング**: すべてのメソッドでtry-catch
3. **デフォルト値**: load()でデータがない場合の安全性
4. **マイグレーション**: 透過的・冪等・安全
5. **テスト可能**: resetMigration()でテスト可能

---

### 5.3 実装チェックリスト

- [ ] StorageUtilsクラスを作成
- [ ] save()メソッドを実装
- [ ] load()メソッドを実装
- [ ] remove()メソッドを実装
- [ ] clear()メソッドを実装
- [ ] migrate()メソッドを実装
- [ ] resetMigration()メソッドを実装
- [ ] main.jsでmigrate()を呼び出し
- [ ] テスト実行（手順2.6に従う）

---

## 📚 次に読むべきドキュメント

このドキュメントを読了したら、実装に進んでください。

### 実装時に参照

- **L1_技術_実装制約.md** セクション4.3（try-catchの使用）
- **L1_技術_実装制約.md** セクション6（コメント規約）

---

## 📝 参考資料

- L1_技術_実装制約.md セクション7（localStorage使用規約）
- L1_データ_共通データ構造.md セクション8（データの同期戦略）

---

## 📅 更新履歴

| 日付 | バージョン | 変更内容 | 担当 |
|------|----------|---------|------|
| 2026-01-03 | 1.0 | 初版作成 | Claude |

---

**最終更新**: 2026年01月03日  
**次回更新予定**: Phase 1実装中のフィードバック反映時

---

**このドキュメントはStorageUtilsクラスの完全な実装仕様です。このドキュメントに従って実装してください。**