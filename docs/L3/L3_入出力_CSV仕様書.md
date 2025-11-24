# L3_入出力_CSV仕様書

**作成日**: 2025年11月23日  
**カテゴリ**: 第3層 - 統合設計  
**バージョン**: 1.0

---

## 📖 このドキュメントについて

このドキュメントは、**CSV形式でのデータ入出力の仕様**を定義します。

### 対象読者

- データ管理担当者
- 実装担当者
- 介護ソフト連携担当者

### 読了後に理解できること

- 算定一覧CSVの読み込み仕様
- CSVファイルのパース方法
- 週間パターンの抽出方法
- 月間スケジュールへの展開ロジック
- CSVエクスポート仕様（Phase 2以降）

### 設計の前提

- **L0_業務_介護ソフトとの関係.md** のケアカルテ連携
- **L1_データ_共通データ構造.md** のUser、ScheduleCalendar
- **L1_技術_技術仕様.md** のデータ管理方針

---

## 1. 算定一覧CSV - インポート仕様

### 1.1 概要

**算定一覧CSV**は、介護ソフト「ケアカルテ」から出力された利用者の週間パターンを含むCSVファイルです。

#### 目的

1. ✅ 利用者の週間サービスパターン（月〜日）を読み込む
2. ✅ 通い・訪問・泊まりの3サービスを識別
3. ✅ 週間パターンを月間スケジュールに自動展開
4. ✅ 既存の備考を保持したまま予定を上書き

#### 対応サービス

| サービス | サービスコード（上2桁） | 説明 |
|---------|----------------------|------|
| **訪問** | `06` | 訪問介護（訪問看護含む） |
| **通い** | `07` | 通所介護（デイサービス） |
| **泊まり** | `08` | 短期入所（ショートステイ） |

---

### 1.2 ファイル形式

#### 基本情報

```
ファイル名: 任意（複数ファイル対応）
文字コード: Shift_JIS
改行コード: CR+LF (Windows形式)
区切り文字: カンマ (,)
引用符: ダブルクォート (")
準拠規格: RFC 4180
```

#### ファイル構造

```
ヘッダー行（1行目）
データ行（2行目以降）
```

---

### 1.3 CSV列定義

| 列番号 | 列名 | 型 | 説明 | 例 |
|-------|------|-----|------|-----|
| 1 | （未使用） | - | 空列 | - |
| 2 | **利用者名** | 文字列 | 利用者の氏名 | `山田太郎` |
| 3 | 時間帯 | 文字列 | サービス時間帯 | `11:00\n17:00` |
| 4 | 区分 | 文字列 | サービス区分 | `基本` |
| 5 | **サービスコード** | 文字列(6桁) | サービス識別コード | `071111` |
| 6 | サービス名 | 文字列 | サービス名称 | `通所` |
| 7 | 付加情報1 | 文字列 | - | `\0` |
| 8 | 付加情報2 | 文字列 | - | `通い` |
| 9 | パターン種別 | 文字列 | パターンタイプ | `曜日指定` |
| 10 | **月曜** | 文字列 | 月曜のパターン | `1` / `2` / `-` |
| 11 | **火曜** | 文字列 | 火曜のパターン | `1` / `2` / `-` |
| 12 | **水曜** | 文字列 | 水曜のパターン | `1` / `2` / `-` |
| 13 | **木曜** | 文字列 | 木曜のパターン | `1` / `2` / `-` |
| 14 | **金曜** | 文字列 | 金曜のパターン | `1` / `2` / `-` |
| 15 | **土曜** | 文字列 | 土曜のパターン | `1` / `2` / `-` |
| 16 | **日曜** | 文字列 | 日曜のパターン | `1` / `2` / `-` |

**重要**: 列10〜16が週間パターン（月曜〜日曜）

---

### 1.4 週間パターンの値

#### 通い（サービスコード上2桁 = `07`）

| 値 | 意味 |
|----|------|
| `1` | 利用あり（○） |
| `-` | 利用なし |
| （空） | 利用なし |

#### 訪問（サービスコード上2桁 = `06`）

| 値 | 意味 |
|----|------|
| `1` | 訪問1回 |
| `2` | 訪問2回 |
| `3` | 訪問3回 |
| `0` | 訪問なし |
| `-` | 訪問なし |
| （空） | 訪問なし |

#### 泊まり（サービスコード上2桁 = `08`）

| 値 | 意味 |
|----|------|
| `1` | 宿泊あり |
| `-` | 宿泊なし |
| （空） | 宿泊なし |

---

### 1.5 CSV例

#### 例1: 基本的なパターン

```csv
,利用者名,時間帯,区分,サービスコード,サービス名,付加1,付加2,パターン種別,月,火,水,木,金,土,日
,山田太郎,11:00\n17:00,基本,071111,通所,\0,通い,曜日指定,1,-,1,-,1,-,-
,山田太郎,,基本,061111,訪問,,,曜日指定,-,1,-,1,-,1,1
,田中花子,10:00\n16:00,基本,071111,通所,\0,通い,曜日指定,-,1,-,1,-,1,-
,田中花子,,基本,081111,宿泊,,,曜日指定,-,-,-,-,1,1,1
```

#### 例2: 複数行の統合

**同一利用者・同一サービスの複数行** → 統合処理

```csv
,佐藤一郎,,基本,061111,訪問,,,曜日指定,1,1,-,-,-,-,-
,佐藤一郎,,基本,062111,訪問,,,曜日指定,-,-,2,2,-,-,-
```

**統合結果**:
- 月曜: `1`回
- 火曜: `1`回
- 水曜: `2`回
- 木曜: `2`回
- 金土日: `0`回

---

### 1.6 サービスコードの判定ルール

#### 判定方法

**サービスコードの上2桁で判定**

```javascript
function getServiceType(serviceCode) {
  const prefix = serviceCode.substring(0, 2);
  
  switch (prefix) {
    case '06':
      return 'visit';   // 訪問
    case '07':
      return 'day';     // 通い
    case '08':
      return 'stay';    // 泊まり
    default:
      return 'unknown';
  }
}
```

#### サービスコード一覧

| サービスコード | サービス名 | 上2桁 | 分類 |
|--------------|----------|------|------|
| 061111 | 訪問介護 | `06` | 訪問 |
| 062111 | 訪問看護 | `06` | 訪問 |
| 071111 | 通所介護 | `07` | 通い |
| 071121 | 地域密着型通所介護 | `07` | 通い |
| 081111 | 短期入所生活介護 | `08` | 泊まり |
| 081131 | 小規模多機能型宿泊 | `08` | 泊まり |

---

### 1.7 複数行の統合ルール

#### ルール1: 利用者名が空の行

**利用者名が空の行は、直前の利用者に属する**

```csv
,山田太郎,11:00\n17:00,基本,071111,通所,\0,通い,曜日指定,1,-,1,-,1,-,-
,,,基本,061111,訪問,,,曜日指定,-,1,-,1,-,1,1
```

→ 2行目は「山田太郎」の訪問パターン

---

#### ルール2: 同一サービスの複数行

**同一利用者・同一サービス種別の複数行は統合**

##### 訪問の場合: 回数を加算

```csv
,佐藤一郎,,基本,061111,訪問,,,曜日指定,1,1,-,-,-,-,-
,佐藤一郎,,基本,062111,訪問,,,曜日指定,-,-,2,2,-,-,-
```

**統合処理**:

```javascript
// 月曜: 1 + 0 = 1
// 火曜: 1 + 0 = 1
// 水曜: 0 + 2 = 2
// 木曜: 0 + 2 = 2
// 金土日: 0 + 0 = 0
```

---

##### 通い・泊まりの場合: OR結合（どちらかが`1`なら`1`）

```csv
,鈴木次郎,,基本,071111,通所,\0,通い,曜日指定,1,-,-,-,-,-,-
,鈴木次郎,,基本,071121,通所,\0,通い,曜日指定,-,1,-,-,-,-,-
```

**統合処理**:

```javascript
// 月曜: 1 OR 0 = 1
// 火曜: 0 OR 1 = 1
// 水〜日: 0 OR 0 = 0
```

---

### 1.8 CSVパース実装（RFC 4180準拠）

#### 問題: 単純な`split(',')`では不十分

**引用符内の改行・カンマを正しく処理できない**

```csv
,山田太郎,"11:00
17:00",基本,071111,通所,...
```

→ 改行が含まれるため、`split('\n')`で行分割すると壊れる

---

#### 解決: RFC 4180準拠のパーサー

**RFC 4180の規則**:
1. フィールドはダブルクォート(`"`)で囲める
2. 引用符内の改行・カンマはフィールドの一部
3. 引用符内の引用符は`""`でエスケープ

```javascript
/**
 * RFC 4180準拠のCSVパーサー
 */
class CSVParser {
  /**
   * CSV行をパース
   * @param {string} line - CSV行
   * @returns {string[]} - フィールド配列
   */
  static parseLine(line) {
    const regex = /("(?:[^"]|"")*"|[^,]*)(,|$)/g;
    const values = [];
    let match;
    
    while ((match = regex.exec(line)) !== null) {
      let value = match[1];
      
      // 引用符で囲まれている場合
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);      // 外側の引用符を除去
        value = value.replace(/""/g, '"'); // ""を"に変換
      }
      
      values.push(value);
      
      // 行末に達した
      if (match[2] === '') break;
    }
    
    return values;
  }
  
  /**
   * CSV全体をパース
   * @param {string} text - CSV全文
   * @returns {string[][]} - 行×列の2次元配列
   */
  static parseCSV(text) {
    const rows = [];
    let currentRow = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // エスケープされた引用符
          currentRow += '""';
          i++; // 次の文字をスキップ
        } else {
          // 引用符の開始/終了
          inQuotes = !inQuotes;
          currentRow += char;
        }
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        // 行の終わり（引用符外の改行）
        if (currentRow.trim()) {
          rows.push(this.parseLine(currentRow));
        }
        currentRow = '';
        
        // CRLFの場合、LFをスキップ
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else {
        currentRow += char;
      }
    }
    
    // 最後の行
    if (currentRow.trim()) {
      rows.push(this.parseLine(currentRow));
    }
    
    return rows;
  }
}
```

---

### 1.9 週間パターンの抽出

```javascript
class WeeklyPatternExtractor {
  /**
   * CSV行から週間パターンを抽出
   * @param {string[][]} rows - パース済みCSV
   * @returns {Map<userId, WeeklyPattern>}
   */
  static extract(rows) {
    const userMap = new Map(); // userName → pattern
    let currentUserName = null;
    
    for (const row of rows) {
      if (row.length < 16) continue; // 不正な行をスキップ
      
      // 列2: 利用者名
      const userName = row[1].trim();
      if (userName) {
        currentUserName = userName;
      }
      
      // 利用者名が確定していない場合はスキップ
      if (!currentUserName) continue;
      
      // パターンを初期化
      if (!userMap.has(currentUserName)) {
        userMap.set(currentUserName, {
          name: currentUserName,
          dayPattern: ['-','-','-','-','-','-','-'],    // 通い
          visitPattern: ['0','0','0','0','0','0','0'],  // 訪問
          stayPattern: ['-','-','-','-','-','-','-']    // 泊まり
        });
      }
      
      const pattern = userMap.get(currentUserName);
      
      // 列5: サービスコード
      const serviceCode = row[4];
      const serviceType = this.getServiceType(serviceCode);
      
      // 列10-16: 週間パターン（月〜日）
      const weekPattern = row.slice(9, 16);
      
      // サービス種別ごとに統合
      this.mergePattern(pattern, serviceType, weekPattern);
    }
    
    return userMap;
  }
  
  /**
   * サービスコードからサービス種別を取得
   */
  static getServiceType(serviceCode) {
    const prefix = serviceCode.substring(0, 2);
    
    switch (prefix) {
      case '06': return 'visit';
      case '07': return 'day';
      case '08': return 'stay';
      default: return 'unknown';
    }
  }
  
  /**
   * パターンを統合
   */
  static mergePattern(pattern, serviceType, weekPattern) {
    switch (serviceType) {
      case 'visit':
        // 訪問: 回数を加算
        for (let i = 0; i < 7; i++) {
          const existingCount = parseInt(pattern.visitPattern[i], 10) || 0;
          const newCount = parseInt(weekPattern[i], 10) || 0;
          pattern.visitPattern[i] = String(existingCount + newCount);
        }
        break;
        
      case 'day':
        // 通い: OR結合
        for (let i = 0; i < 7; i++) {
          if (weekPattern[i] === '1') {
            pattern.dayPattern[i] = '1';
          }
        }
        break;
        
      case 'stay':
        // 泊まり: OR結合
        for (let i = 0; i < 7; i++) {
          if (weekPattern[i] === '1') {
            pattern.stayPattern[i] = '1';
          }
        }
        break;
    }
  }
}
```

---

### 1.10 月間スケジュールへの展開

```javascript
class MonthlyScheduleExpander {
  /**
   * 週間パターンを月間スケジュールに展開
   * @param {Map<userName, WeeklyPattern>} weeklyPatterns
   * @param {string} yearMonth - 対象月 (YYYY-MM)
   * @returns {Map<userId, ScheduleCalendar>}
   */
  static expand(weeklyPatterns, yearMonth, users) {
    const calendars = new Map();
    const [year, month] = yearMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (const user of users) {
      const calendar = new ScheduleCalendar(user.userId, yearMonth);
      const pattern = weeklyPatterns.get(user.name);
      
      if (!pattern) {
        calendars.set(user.userId, calendar);
        continue;
      }
      
      // 各日付に対して処理
      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${yearMonth}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = new Date(year, month - 1, day).getDay(); // 0=日, 1=月, ...
        const patternIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 月〜日 → 0〜6
        
        // 通いパターン
        if (pattern.dayPattern[patternIndex] === '1') {
          calendar.setCell(date, 'dayStay', '○');
        }
        
        // 訪問パターン
        const visitCount = parseInt(pattern.visitPattern[patternIndex], 10);
        if (visitCount > 0) {
          calendar.setCell(date, 'visit', String(visitCount));
        }
        
        // 宿泊パターン（仮で「入」を設定）
        if (pattern.stayPattern[patternIndex] === '1') {
          calendar.setCell(date, 'dayStay', '入');
        }
      }
      
      // 宿泊期間を調整（連続する宿泊を「入→○→...→退」に変換）
      this.adjustStayPeriods(calendar);
      
      calendars.set(user.userId, calendar);
    }
    
    return calendars;
  }
  
  /**
   * 連続する宿泊を「入所→退所」期間に調整
   */
  static adjustStayPeriods(calendar) {
    const dayCells = [];
    
    // 通泊行のセルで「入」が設定されているセルを取得
    for (const [key, cell] of calendar.cells) {
      if (cell.cellType === 'dayStay' && cell.inputValue === '入') {
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
        // 単独宿泊: そのまま「入」（ユーザーが手動で「退」を設定）
        continue;
      } else {
        // 連続宿泊: 入所→○→...→退所
        const firstCell = group[0];
        const lastCell = group[group.length - 1];
        
        // 開始日: 入
        calendar.setCell(firstCell.date, 'dayStay', '入');
        
        // 中間日: ○
        for (let i = 1; i < group.length - 1; i++) {
          const cell = group[i];
          calendar.setCell(cell.date, 'dayStay', '○');
        }
        
        // 終了日: 退
        calendar.setCell(lastCell.date, 'dayStay', '退');
      }
    }
  }
}
```

---

### 1.11 既存備考の保持

```javascript
class ScheduleMerger {
  /**
   * 既存の備考を保持したまま予定を上書き
   * @param {Map<userId, ScheduleCalendar>} newCalendars - 新しいスケジュール
   * @param {string} yearMonth - 対象月
   * @returns {Map<userId, ScheduleCalendar>} - マージ済みスケジュール
   */
  static mergeWithExistingNotes(newCalendars, yearMonth) {
    const storageService = new StorageService();
    const existingData = storageService.loadSchedule(yearMonth);
    
    if (!existingData || existingData.size === 0) {
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
}
```

---

### 1.12 CSVインポートの統合フロー

```javascript
class CSVImportService {
  /**
   * CSV取り込み処理
   * @param {FileList} files - CSVファイルリスト
   * @param {string} yearMonth - 対象月
   * @returns {Promise<{users: User[], calendars: Map}>}
   */
  async importCSV(files, yearMonth) {
    try {
      // 1. Shift_JISでファイルを読み込み
      const allRows = await this.readCSVFiles(files);
      
      // 2. 週間パターンを抽出
      const weeklyPatterns = WeeklyPatternExtractor.extract(allRows);
      
      // 3. 利用者マスタを生成（あいうえお順）
      const users = this.createUsers(weeklyPatterns);
      
      // 4. 月間スケジュールに展開
      const calendars = MonthlyScheduleExpander.expand(
        weeklyPatterns,
        yearMonth,
        users
      );
      
      // 5. 既存の備考を保持
      const mergedCalendars = ScheduleMerger.mergeWithExistingNotes(
        calendars,
        yearMonth
      );
      
      return { users, calendars: mergedCalendars };
      
    } catch (error) {
      console.error('CSV import failed:', error);
      throw error;
    }
  }
  
  /**
   * Shift_JISでファイルを読み込み
   */
  async readCSVFiles(files) {
    const allRows = [];
    
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const text = this.decodeShiftJIS(arrayBuffer);
      const rows = CSVParser.parseCSV(text);
      
      // ヘッダー行をスキップ
      allRows.push(...rows.slice(1));
    }
    
    return allRows;
  }
  
  /**
   * Shift_JISデコード
   */
  decodeShiftJIS(arrayBuffer) {
    const decoder = new TextDecoder('shift-jis');
    return decoder.decode(arrayBuffer);
  }
  
  /**
   * 利用者マスタを生成
   */
  createUsers(weeklyPatterns) {
    const userNames = Array.from(weeklyPatterns.keys()).sort((a, b) => 
      a.localeCompare(b, 'ja')
    );
    
    return userNames.map((name, index) => {
      return new User({
        userId: `user${String(index + 1).padStart(3, '0')}`,
        name: name,
        displayName: name,
        registrationDate: new Date(),
        sortId: index
      });
    });
  }
}
```

---

### 1.13 算定基礎CSV取り込みUI仕様

#### 1.13.1 取り込みフロー

```
┌─────────────────────────────────────┐
│ 1. CSVファイル選択                  │
│    [ファイルを選択]ボタン            │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 2. プレビュー画面                   │
│    ・利用者一覧（氏名・介護度・パターン）│
│    ・重複チェック（氏名ベース）      │
│    ・✓ボックスで取り込み選択        │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 3. 利用者マスタ登録                 │
│    ・選択された利用者を登録          │
│    ・weeklyPatternを保存            │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 4. 利用者マスタ画面表示             │
│    ・登録された利用者一覧            │
│    ・各利用者の週間パターン表示      │
│    ・[展開]ボタンで月間予定に展開    │
└─────────────────────────────────────┘
```

---

#### 1.13.2 プレビュー画面の仕様

##### 画面レイアウト

```
┌─────────────────────────────────────────────────────┐
│ 算定基礎CSV取り込みプレビュー                        │
├─────────────────────────────────────────────────────┤
│ 📄 読み込みファイル: santei_2025_11.csv (1件)       │
│                                                     │
│ ⚠️ 以下の利用者を取り込みますか？                   │
│                                                     │
│ ┌─┬────┬──────┬──────┬───────────────┐ │
│ │✓│氏名  │介護度│重複  │週間パターン      │ │
│ ├─┼────┼──────┼──────┼───────────────┤ │
│ │☑│山田太郎│要介2 │  　  │月水金:通い 火木:訪問│ │
│ │☑│佐藤花子│要介1 │  　  │火木土:通い       │ │
│ │☐│田中一郎│要介3 │🔴重複│金土日:泊まり     │ │
│ │☐│鈴木次郎│要介2 │🔴重複│月水:通い 火木:訪問│ │
│ │☑│高橋美咲│要介1 │  　  │月火水木金:通い   │ │
│ └─┴────┴──────┴──────┴───────────────┘ │
│                                                     │
│ ℹ️ 重複について:                                    │
│ 氏名が既存の利用者と重複しています。                │
│ 重複する利用者は初期状態で選択解除されています。    │
│                                                     │
│ [✓すべて選択] [✓重複以外を選択] [すべて解除]       │
│                                                     │
│ [キャンセル]           [取り込み (3名選択中)]        │
└─────────────────────────────────────────────────────┘
```

---

##### 重複チェックのロジック

```javascript
/**
 * 氏名ベースで重複をチェック
 */
class DuplicateChecker {
  /**
   * 重複チェック
   * @param {string} name - チェック対象の氏名
   * @param {User[]} existingUsers - 既存の利用者リスト
   * @returns {boolean} - 重複している場合true
   */
  static isDuplicate(name, existingUsers) {
    return existingUsers.some(user => user.name === name);
  }
  
  /**
   * プレビューデータを生成
   */
  static generatePreview(weeklyPatterns, existingUsers) {
    const previewList = [];
    
    for (const [name, pattern] of weeklyPatterns) {
      const isDup = this.isDuplicate(name, existingUsers);
      
      previewList.push({
        name,
        careLevel: pattern.careLevel || '不明',
        isDuplicate: isDup,
        checked: !isDup,  // 重複していない場合のみ初期チェック
        weeklyPattern: pattern,
        patternSummary: this.formatPatternSummary(pattern)
      });
    }
    
    return previewList;
  }
  
  /**
   * パターンサマリーをフォーマット
   */
  static formatPatternSummary(pattern) {
    const parts = [];
    
    // 通い
    const dayDays = this.getDaysFromPattern(pattern.dayPattern);
    if (dayDays.length > 0) {
      parts.push(`${dayDays.join('')}:通い`);
    }
    
    // 訪問
    const visitDays = this.getDaysFromPattern(pattern.visitPattern, true);
    if (visitDays.length > 0) {
      parts.push(`${visitDays.join('')}:訪問`);
    }
    
    // 泊まり
    const stayDays = this.getDaysFromPattern(pattern.stayPattern);
    if (stayDays.length > 0) {
      parts.push(`${stayDays.join('')}:泊まり`);
    }
    
    return parts.join(' ');
  }
  
  /**
   * パターンから曜日を取得
   */
  static getDaysFromPattern(pattern, isVisit = false) {
    const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const value = pattern[i];
      if (isVisit) {
        if (value !== '0' && value !== '-' && value) {
          days.push(dayNames[i]);
        }
      } else {
        if (value === '1') {
          days.push(dayNames[i]);
        }
      }
    }
    
    return days;
  }
}
```

---

##### チェックボックスの初期状態

| 条件 | 初期状態 |
|------|---------|
| 氏名が重複していない | ✓ チェックあり |
| 氏名が重複している | ☐ チェックなし |

---

#### 1.13.3 利用者マスタ登録処理

```javascript
class UserMasterRegistration {
  /**
   * 選択された利用者をマスタに登録
   * @param {Array} previewList - プレビューリスト
   * @param {MasterDataManager} masterData
   * @returns {User[]} - 登録された利用者リスト
   */
  static register(previewList, masterData) {
    const registeredUsers = [];
    
    for (const item of previewList) {
      if (!item.checked) continue;  // チェックされていない
      
      // 利用者IDを生成
      const userId = this.generateUserId(masterData.getAllUsers());
      
      // Userオブジェクトを作成
      const user = new User({
        userId,
        name: item.name,
        kana: this.convertToKana(item.name),  // 簡易変換
        displayName: item.name,
        weeklyPattern: item.weeklyPattern,
        registrationDate: new Date().toISOString(),
        sortId: masterData.getAllUsers().length + 1,
        isActive: true
      });
      
      // マスタに追加
      if (masterData.addUser(user)) {
        registeredUsers.push(user);
      }
    }
    
    return registeredUsers;
  }
  
  /**
   * 利用者IDを生成
   */
  static generateUserId(existingUsers) {
    const existingIds = existingUsers.map(u => 
      parseInt(u.userId.replace('user', ''))
    );
    
    for (let i = 1; i <= 29; i++) {
      if (!existingIds.includes(i)) {
        return `user${String(i).padStart(3, '0')}`;
      }
    }
    
    throw new Error('利用者定員（29人）に達しています');
  }
  
  /**
   * 氏名からカナを簡易変換（完全な変換はPhase 2以降）
   */
  static convertToKana(name) {
    // Phase 1では氏名をそのまま返す
    // Phase 2でMeCabなどを使用した変換を実装
    return name;
  }
}
```

---

#### 1.13.4 利用者マスタ画面の仕様

##### 画面レイアウト

```
┌─────────────────────────────────────────────────────┐
│ 利用者マスタ管理                                     │
├─────────────────────────────────────────────────────┤
│ [+ 新規登録] [CSV取り込み] [エクスポート]           │
│                                                     │
│ ┌─────┬──────────┬───────────────────────┐ │
│ │     │利用者情報│週間パターン              │ │
│ ├─────┼──────────┼───────────────────────┤ │
│ │user001                                          │ │
│ │ 山田太郎 要介2                                  │ │
│ │ 登録日: 2025-11-23                              │ │
│ │                                                 │ │
│ │ 📅 週間利用パターン                             │ │
│ │ ┌───┬───┬───┬───┬───┬───┬───┐ │ │
│ │ │月 │火 │水 │木 │金 │土 │日 │ │ │
│ │ ├───┼───┼───┼───┼───┼───┼───┤ │ │
│ │ │通 ○│   │通 ○│   │通 ○│   │   │ │ │
│ │ │   │訪 1│   │訪 1│   │訪 1│訪 1│ │ │
│ │ └───┴───┴───┴───┴───┴───┴───┘ │ │
│ │                                                 │ │
│ │ [編集] [削除] [📆 月間予定に展開]               │ │
│ ├─────────────────────────────────────────┤ │
│ │user002                                          │ │
│ │ 佐藤花子 要介1                                  │ │
│ │ ...                                             │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

##### 月間予定展開ボタン

```javascript
class WeeklyPatternExpander {
  /**
   * 週間パターンを月間予定に展開
   * @param {User} user - 対象利用者
   * @param {string} yearMonth - 対象月 "YYYY-MM"
   */
  static expandToMonthly(user, yearMonth) {
    if (!user.weeklyPattern) {
      throw new Error('週間パターンが設定されていません');
    }
    
    // MonthlyScheduleExpander.expand を使用
    const patterns = new Map();
    patterns.set(user.name, user.weeklyPattern);
    
    const calendars = MonthlyScheduleExpander.expand(
      patterns,
      yearMonth,
      [user]
    );
    
    // 既存予定とマージ
    const mergedCalendars = ScheduleMerger.mergeWithExistingNotes(
      calendars,
      yearMonth
    );
    
    // 各セクションに保存
    const calendar = mergedCalendars.get(user.userId);
    this.saveToSections(calendar);
    
    return calendar;
  }
  
  /**
   * セクションごとにスケジュールを保存
   */
  static saveToSections(calendar) {
    // 通いセクション
    const kayoiSchedules = this.extractKayoiSchedules(calendar);
    kayoiSection.importSchedules(kayoiSchedules);
    
    // 泊まりセクション
    const tomariReservations = this.extractTomariReservations(calendar);
    tomariSection.importReservations(tomariReservations);
    
    // 訪問セクション
    const houmonSchedules = this.extractHoumonSchedules(calendar);
    houmonSection.importSchedules(houmonSchedules);
  }
}
```

---

#### 1.13.5 UI実装コード例

```javascript
// プレビュー画面の表示
function showPreviewDialog(previewList) {
  const html = `
    <div class="csv-preview-dialog">
      <h2>算定基礎CSV取り込みプレビュー</h2>
      
      <div class="file-info">
        📄 読み込みファイル: ${fileName} (${previewList.length}件)
      </div>
      
      <div class="warning">
        ⚠️ 以下の利用者を取り込みますか？
      </div>
      
      <table class="preview-table">
        <thead>
          <tr>
            <th><input type="checkbox" id="check-all"></th>
            <th>氏名</th>
            <th>介護度</th>
            <th>重複</th>
            <th>週間パターン</th>
          </tr>
        </thead>
        <tbody>
          ${previewList.map(item => `
            <tr class="${item.isDuplicate ? 'duplicate-row' : ''}">
              <td><input type="checkbox" ${item.checked ? 'checked' : ''} 
                         data-name="${item.name}"></td>
              <td>${item.name}</td>
              <td>${item.careLevel}</td>
              <td>${item.isDuplicate ? '🔴重複' : ''}</td>
              <td class="pattern-summary">${item.patternSummary}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="duplicate-info">
        ℹ️ 重複について: 氏名が既存の利用者と重複しています。
      </div>
      
      <div class="preview-actions">
        <button id="check-all-btn">✓すべて選択</button>
        <button id="check-non-dup-btn">✓重複以外を選択</button>
        <button id="uncheck-all-btn">すべて解除</button>
      </div>
      
      <div class="dialog-buttons">
        <button id="cancel-btn" class="btn-secondary">キャンセル</button>
        <button id="import-btn" class="btn-primary">
          取り込み (<span id="selected-count">0</span>名選択中)
        </button>
      </div>
    </div>
  `;
  
  showModal(html);
  setupPreviewEventListeners();
}

// イベントリスナーのセットアップ
function setupPreviewEventListeners() {
  // 全選択
  document.getElementById('check-all-btn').addEventListener('click', () => {
    document.querySelectorAll('.preview-table input[type="checkbox"]')
      .forEach(cb => cb.checked = true);
    updateSelectedCount();
  });
  
  // 重複以外を選択
  document.getElementById('check-non-dup-btn').addEventListener('click', () => {
    document.querySelectorAll('.preview-table tr').forEach(row => {
      if (!row.classList.contains('duplicate-row')) {
        row.querySelector('input[type="checkbox"]').checked = true;
      }
    });
    updateSelectedCount();
  });
  
  // 選択数の更新
  function updateSelectedCount() {
    const count = document.querySelectorAll(
      '.preview-table input[type="checkbox"]:checked'
    ).length;
    document.getElementById('selected-count').textContent = count;
  }
}
```

---

#### 1.13.6 CSSスタイル例

```css
/* プレビュー画面 */
.csv-preview-dialog {
  max-width: 900px;
  padding: 24px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.preview-table th,
.preview-table td {
  padding: 12px;
  border: 1px solid #ddd;
  text-align: left;
}

.preview-table thead {
  background-color: #f5f5f5;
}

/* 重複行を薄く赤く染める */
.duplicate-row {
  background-color: rgba(255, 0, 0, 0.05);
}

.duplicate-row:hover {
  background-color: rgba(255, 0, 0, 0.1);
}

.pattern-summary {
  font-size: 0.9em;
  color: #666;
}

.duplicate-info {
  background-color: #e3f2fd;
  padding: 12px;
  border-radius: 4px;
  margin: 16px 0;
}
```

---

## 2. CSVエクスポート仕様（Phase 2以降）

### 2.1 エクスポート形式

#### 対応形式

| 形式 | 説明 | Phase |
|------|------|-------|
| **JSON** | 全データのバックアップ | Phase 1 |
| **CSV** | 月間スケジュール | Phase 2 |
| **Excel** | 印刷用フォーマット | Phase 2 |

---

### 2.2 JSONエクスポート（Phase 1）

```javascript
class JSONExporter {
  /**
   * 全データをJSONでエクスポート
   */
  static export() {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      users: masterData.users.map(u => u.toJSON()),
      staff: masterData.staff.map(s => s.toJSON()),
      rooms: masterData.rooms.map(r => r.toJSON()),
      kayoiSchedules: kayoiSection.schedules.map(s => s.toJSON()),
      tomariReservations: tomariSection.reservations.map(r => r.toJSON()),
      houmonSchedules: houmonSection.schedules.map(s => s.toJSON())
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-b-data_${this.getDateString()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }
  
  static getDateString() {
    const now = new Date();
    return now.toISOString().split('T')[0].replace(/-/g, '');
  }
}
```

---

### 2.3 CSVエクスポート（Phase 2）

#### フォーマット

```csv
利用者名,日付,通い,訪問,泊まり,備考
山田太郎,2025-11-01,○,0,-,
山田太郎,2025-11-02,-,1,-,
山田太郎,2025-11-03,○,0,-,
田中花子,2025-11-01,-,0,入,体調良好
田中花子,2025-11-02,-,0,○,
田中花子,2025-11-03,-,0,退,
```

---

## 3. エラーハンドリング

### 3.1 エラー種別

| エラー種別 | 原因 | 対処 |
|-----------|------|------|
| **文字コードエラー** | Shift_JIS以外のファイル | エラーメッセージ表示 |
| **CSV形式エラー** | 列数不足、不正な引用符 | 行番号を表示 |
| **データ不正エラー** | サービスコード不明 | 該当行をスキップ |
| **ファイル読み込みエラー** | ファイルアクセス失敗 | リトライ促進 |

---

### 3.2 エラーハンドリングコード

```javascript
try {
  const result = await csvImportService.importCSV(files, yearMonth);
  
  Toast.show(`${result.users.length}名の利用者を取り込みました`, 'success');
  
} catch (error) {
  if (error.message.includes('Shift_JIS')) {
    Toast.show('CSVファイルの文字コードがShift_JISではありません', 'error');
  } else if (error.message.includes('parse')) {
    Toast.show('CSVファイルの形式が不正です', 'error');
  } else if (error.message.includes('column')) {
    Toast.show('CSVファイルの列数が不足しています', 'error');
  } else {
    Toast.show('予期しないエラーが発生しました', 'error');
    console.error(error);
  }
}
```

---

## 4. パフォーマンス最適化

### 4.1 大量データ処理

```javascript
/**
 * バッチ処理でUIをブロックしない
 */
async function processBatch(items, batchSize = 10) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    // バッチ処理
    const batchResults = batch.map(item => processItem(item));
    results.push(...batchResults);
    
    // UI更新の余地を与える
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return results;
}
```

---

### 4.2 進捗表示

```javascript
class CSVImportWithProgress {
  async importCSV(files, yearMonth, onProgress) {
    const totalSteps = 5;
    let currentStep = 0;
    
    // ステップ1: ファイル読み込み
    onProgress(++currentStep, totalSteps, 'ファイルを読み込んでいます...');
    const allRows = await this.readCSVFiles(files);
    
    // ステップ2: パターン抽出
    onProgress(++currentStep, totalSteps, 'パターンを抽出しています...');
    const weeklyPatterns = WeeklyPatternExtractor.extract(allRows);
    
    // ステップ3: 利用者生成
    onProgress(++currentStep, totalSteps, '利用者を登録しています...');
    const users = this.createUsers(weeklyPatterns);
    
    // ステップ4: 月間展開
    onProgress(++currentStep, totalSteps, 'スケジュールを展開しています...');
    const calendars = MonthlyScheduleExpander.expand(
      weeklyPatterns,
      yearMonth,
      users
    );
    
    // ステップ5: マージ
    onProgress(++currentStep, totalSteps, '既存データとマージしています...');
    const mergedCalendars = ScheduleMerger.mergeWithExistingNotes(
      calendars,
      yearMonth
    );
    
    return { users, calendars: mergedCalendars };
  }
}

// 使用例
csvImportService.importCSV(files, yearMonth, (current, total, message) => {
  const percentage = Math.round((current / total) * 100);
  Loading.show(`${message} (${percentage}%)`);
});
```

---

## 5. テスト仕様

### 5.1 単体テスト

#### テストケース1: CSVパース

```javascript
describe('CSVParser', () => {
  it('should parse basic CSV line', () => {
    const line = ',山田太郎,11:00,基本,071111,通所';
    const result = CSVParser.parseLine(line);
    
    expect(result).toEqual(['', '山田太郎', '11:00', '基本', '071111', '通所']);
  });
  
  it('should handle quoted fields with commas', () => {
    const line = ',"山田,太郎",11:00,基本,071111,通所';
    const result = CSVParser.parseLine(line);
    
    expect(result[1]).toBe('山田,太郎');
  });
  
  it('should handle quoted fields with newlines', () => {
    const line = ',山田太郎,"11:00\n17:00",基本,071111,通所';
    const result = CSVParser.parseLine(line);
    
    expect(result[2]).toBe('11:00\n17:00');
  });
  
  it('should handle escaped quotes', () => {
    const line = ',山田太郎,"彼は""太郎""です",基本,071111,通所';
    const result = CSVParser.parseLine(line);
    
    expect(result[2]).toBe('彼は"太郎"です');
  });
});
```

---

#### テストケース2: 週間パターン抽出

```javascript
describe('WeeklyPatternExtractor', () => {
  it('should extract day pattern', () => {
    const rows = [
      ['', '山田太郎', '', '基本', '071111', '通所', '', '', '曜日指定', '1', '-', '1', '-', '1', '-', '-']
    ];
    
    const patterns = WeeklyPatternExtractor.extract(rows);
    const pattern = patterns.get('山田太郎');
    
    expect(pattern.dayPattern).toEqual(['1', '-', '1', '-', '1', '-', '-']);
  });
  
  it('should merge multiple visit rows', () => {
    const rows = [
      ['', '山田太郎', '', '基本', '061111', '訪問', '', '', '曜日指定', '1', '1', '-', '-', '-', '-', '-'],
      ['', '山田太郎', '', '基本', '062111', '訪問', '', '', '曜日指定', '-', '-', '2', '2', '-', '-', '-']
    ];
    
    const patterns = WeeklyPatternExtractor.extract(rows);
    const pattern = patterns.get('山田太郎');
    
    expect(pattern.visitPattern).toEqual(['1', '1', '2', '2', '0', '0', '0']);
  });
});
```

---

### 5.2 統合テスト

```javascript
describe('CSVImportService', () => {
  it('should import CSV and create schedules', async () => {
    const csvContent = `
,利用者名,時間帯,区分,サービスコード,サービス名,付加1,付加2,パターン種別,月,火,水,木,金,土,日
,山田太郎,11:00,基本,071111,通所,\\0,通い,曜日指定,1,-,1,-,1,-,-
,山田太郎,,基本,061111,訪問,,,曜日指定,-,1,-,1,-,1,1
    `.trim();
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=shift-jis' });
    const file = new File([blob], 'test.csv');
    
    const result = await csvImportService.importCSV([file], '2025-11');
    
    expect(result.users).toHaveLength(1);
    expect(result.users[0].name).toBe('山田太郎');
    expect(result.calendars.size).toBe(1);
  });
});
```

---

## 6. まとめ

### 6.1 このドキュメントで定義したこと

```
✅ 定義したこと
├─ 算定一覧CSVの列定義
├─ サービスコードの判定ルール（上2桁）
├─ 週間パターンの値の意味
├─ 複数行の統合ルール（訪問=加算、通い/泊まり=OR）
├─ RFC 4180準拠のCSVパーサー実装
├─ 週間→月間展開のロジック
├─ 連続宿泊の調整アルゴリズム
├─ 既存備考の保持方法
├─ JSONエクスポート（Phase 1）
├─ CSVエクスポート（Phase 2）
├─ エラーハンドリング
├─ パフォーマンス最適化
└─ テスト仕様
```

---

### 6.2 重要なポイント

1. **RFC 4180準拠**: 引用符内の改行・カンマを正しく処理
2. **サービスコード上2桁**: `06`=訪問、`07`=通い、`08`=泊まり
3. **複数行統合**: 訪問は加算、通い/泊まりはOR結合
4. **連続宿泊調整**: 「入→○→...→退」に自動変換
5. **備考保持**: 既存の備考を保持したまま予定を上書き

---

### 6.3 Phase 1で実装すること

```
✅ Phase 1
├─ Shift_JIS読み込み
├─ RFC 4180準拠パーサー
├─ 週間パターン抽出
├─ 月間スケジュール展開
├─ 連続宿泊調整
├─ 備考保持
└─ JSONエクスポート

⏭️ Phase 2以降
├─ CSVエクスポート
├─ Excelエクスポート
├─ 進捗表示UI
└─ エラー詳細表示
```

---

### 6.4 次のステップ

CSV仕様が確定しました。

**次に作成すべきドキュメント**:
- **L3_入出力_Excel仕様.md** - Excel入出力仕様
- **実装ガイド_Phase1_CSV実装.md** - 実装手順書

**実装の順序**:
1. CSVParser実装
2. WeeklyPatternExtractor実装
3. MonthlyScheduleExpander実装
4. CSVImportService統合
5. UI連携（ファイル選択ダイアログ）

---

## 📚 次に読むべきドキュメント

このドキュメントを読了したら、以下のドキュメントに進んでください。

### 関連ドキュメント

- **L3_入出力_Excel仕様.md** - Excel入出力の詳細
- **L1_データ_共通データ構造.md** - User、ScheduleCalendarクラス
- **L0_業務_介護ソフトとの関係.md** - ケアカルテ連携の背景

---

## 📝 参考資料

- RFC 4180: Common Format and MIME Type for CSV Files
- ケアカルテ操作マニュアル（算定一覧出力）
- L1_技術_技術仕様.md（文字コード対応）

---

## 📅 更新履歴

| 日付 | バージョン | 変更内容 | 担当 |
|------|----------|---------|------|
| 2025-11-23 | 1.0 | 初版作成（別プロジェクト実装ガイドより抽出） | Claude |

---

**最終更新**: 2025年11月23日  
**次回更新予定**: Phase 1実装中のフィードバック反映時

---

## ⚠️ 設計チェックリスト

このドキュメントの品質チェック：

- [x] CSV列定義が明確
- [x] サービスコードの判定ルールが具体的
- [x] 複数行の統合ルールが明確
- [x] RFC 4180準拠の実装コードあり
- [x] 週間→月間展開のアルゴリズムが具体的
- [x] 連続宿泊調整のロジックが実装可能
- [x] エラーハンドリングが定義されている
- [x] テストケースが具体的
- [x] パフォーマンス最適化が考慮されている

---

**このドキュメントを読了したら、INDEX_ドキュメント構成.md に戻り、Excel仕様に進んでください。**
