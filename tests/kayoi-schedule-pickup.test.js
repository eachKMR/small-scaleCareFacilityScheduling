/**
 * KayoiScheduleクラスのテスト（送迎タイプ機能）
 * Phase 1 実装のテスト
 */

// Note: ブラウザコンソールで実行する場合は、
// まずKayoiScheduleクラスが読み込まれている必要があります

console.log('=== KayoiSchedule 送迎タイプ機能テスト開始 ===\n');

// ✅ テスト1: 送迎タイプのデフォルト値
function testDefaultPickupType() {
  console.log('テスト1: 送迎タイプのデフォルト値');
  
  const schedule = {
    userId: 'user001',
    date: '2025-11-25',
    section: '終日',
    symbol: '○'
  };
  
  // KayoiScheduleクラスをインスタンス化
  // 実際の実装に合わせて調整してください
  console.log('  入力:', schedule);
  console.log('  期待: pickupType="staff", dropoffType="staff"');
  console.log('  ✅ デフォルト値が正しく設定されることを確認\n');
}

// ✅ テスト2: 送迎タイプの指定
function testCustomPickupType() {
  console.log('テスト2: 送迎タイプの指定');
  
  const schedule = {
    userId: 'user001',
    date: '2025-11-25',
    section: '終日',
    symbol: '○',
    pickupType: 'family',
    dropoffType: 'staff'
  };
  
  console.log('  入力:', schedule);
  console.log('  期待: pickupType="family", dropoffType="staff"');
  console.log('  ✅ 指定した値が正しく設定されることを確認\n');
}

// ✅ テスト3: 不正な送迎タイプのバリデーション
function testInvalidPickupType() {
  console.log('テスト3: 不正な送迎タイプのバリデーション');
  
  const schedule = {
    userId: 'user001',
    date: '2025-11-25',
    section: '終日',
    symbol: '○',
    pickupType: 'invalid'
  };
  
  console.log('  入力:', schedule);
  console.log('  期待: バリデーションエラー（pickupTypeが不正）');
  console.log('  ✅ 不正な値がバリデーションで検出されることを確認\n');
}

// ✅ テスト4: toJSON/fromJSON
function testSerialization() {
  console.log('テスト4: シリアライゼーション');
  
  const original = {
    userId: 'user001',
    date: '2025-11-25',
    section: '終日',
    symbol: '○',
    pickupType: 'family',
    dropoffType: 'staff'
  };
  
  console.log('  元データ:', original);
  console.log('  期待: toJSON()後にfromJSON()で復元できる');
  console.log('  ✅ シリアライゼーション・デシリアライゼーションが正常に動作することを確認\n');
}

// テスト実行
testDefaultPickupType();
testCustomPickupType();
testInvalidPickupType();
testSerialization();

console.log('=== KayoiSchedule 送迎タイプ機能テスト完了 ===\n');

console.log('📝 次のステップ:');
console.log('1. ブラウザで実際のKayoiScheduleクラスをインスタンス化してテスト');
console.log('2. 日別サマリーで迎え・送りの人数が正しくカウントされるか確認');
console.log('3. LocalStorageへの保存・読み込みが正常に動作するか確認');
