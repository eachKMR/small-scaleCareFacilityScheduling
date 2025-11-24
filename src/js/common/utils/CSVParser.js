/**
 * CSVParser.js
 * RFC 4180準拠のCSVパーサー
 */

export class CSVParser {
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
   * Shift_JISのArrayBufferをデコード
   * @param {ArrayBuffer} arrayBuffer
   * @returns {string}
   */
  static decodeShiftJIS(arrayBuffer) {
    try {
      // まずShift_JISで試す
      const decoder = new TextDecoder('shift-jis');
      const text = decoder.decode(arrayBuffer);
      
      // 文字化けチェック（簡易）
      if (text.includes('�') || /[\uFFFD]/.test(text)) {
        console.log('Shift_JISデコード失敗、UTF-8で再試行');
        const utf8Decoder = new TextDecoder('utf-8');
        return utf8Decoder.decode(arrayBuffer);
      }
      
      return text;
    } catch (error) {
      console.log('Shift_JISデコード失敗、UTF-8で再試行');
      const utf8Decoder = new TextDecoder('utf-8');
      return utf8Decoder.decode(arrayBuffer);
    }
  }
}
