// Excel解析エンジンのローカルテスト

const { SurveyAnalyzer, ExcelFormatDetector } = require('./lib/excel/analyzer.ts');
const { sampleNewFormatData, headerTestPatterns, TestDataGenerator } = require('./lib/excel/test-data.ts');

console.log('🧪 Excel解析エンジン テスト開始\n');

// 1. フォーマット検出テスト
console.log('1️⃣ フォーマット検出テスト');
console.log('━━━━━━━━━━━━━━━━━━━━━━━');

try {
  // 新フォーマットの検出
  const newFormatResult = ExcelFormatDetector.detectFormat(headerTestPatterns.completeNewFormat);
  console.log('✅ 新フォーマット検出:', newFormatResult.format, `(信頼度: ${newFormatResult.confidence})`);

  // 旧フォーマットの検出
  const legacyFormatResult = ExcelFormatDetector.detectFormat(headerTestPatterns.completeLegacyFormat);
  console.log('✅ 旧フォーマット検出:', legacyFormatResult.format, `(信頼度: ${legacyFormatResult.confidence})`);

  // 不明フォーマットの検出
  const unknownFormatResult = ExcelFormatDetector.detectFormat(headerTestPatterns.unknownFormat);
  console.log('✅ 不明フォーマット検出:', unknownFormatResult.format, `(信頼度: ${unknownFormatResult.confidence})`);
} catch (error) {
  console.log('❌ フォーマット検出エラー:', error.message);
}

console.log('\n');

// 2. データ変換テスト
console.log('2️⃣ データ変換テスト');
console.log('━━━━━━━━━━━━━━━━━━');

try {
  // サンプルデータの変換テスト
  const testRow = [
    '2024-06-01T09:00:00Z',
    'ダイセー株式会社',
    '管理職',
    '技術・専門職',
    '男性',
    '40代',
    '5-10年',
    4, 5, 3, 4, 3, 4, 5, 3, 4, 4, 5, 4, 3, 2, 4, 3, 4, 5, 4, 5, 4, 4, 5, 4, 5, 4,
    '6-10社',
    'はい',
    'はい',
    '給与・待遇が良い, 会社の将来性',
    '読んでいる, 役に立つ',
    '残業時間がやや多い',
    'いいえ',
    '',
    'チームワークが良い',
    'デジタル化を進めてほしい',
    'Excel作業の自動化'
  ];
  
  const testHeaders = headerTestPatterns.completeNewFormat.slice(0, testRow.length);
  const convertedData = ExcelFormatDetector.convertToNewFormat(testRow, testHeaders);
  
  console.log('✅ データ変換成功');
  console.log('   - 会社名:', convertedData.company_name);
  console.log('   - 役職:', convertedData.position);
  console.log('   - 満足度スコア例:', convertedData.salary_satisfaction);
  console.log('   - グループ認知度:', convertedData.group_companies_known);
} catch (error) {
  console.log('❌ データ変換エラー:', error.message);
}

console.log('\n');

// 3. 分析エンジンテスト
console.log('3️⃣ 分析エンジンテスト');
console.log('━━━━━━━━━━━━━━━━━━');

try {
  // テストデータ生成
  const testData = TestDataGenerator.generateRandomData(50);
  console.log('✅ テストデータ生成完了:', testData.length, '件');

  // SurveyResponseフォーマットに変換
  const surveyResponses = testData.map((data, index) => ({
    rowNumber: index + 1,
    responseId: `test_${index + 1}`,
    timestamp: data.timestamp.toISOString(),
    answers: {
      company_name: data.company_name,
      position: data.position,
      job_type: data.job_type,
      gender: data.gender,
      age_group: data.age_group,
      tenure: data.tenure,
      salary_satisfaction: data.salary_satisfaction,
      job_satisfaction: data.job_satisfaction,
      opinion_expression: data.opinion_expression,
      supportive_culture: data.supportive_culture,
      work_environment: data.work_environment
    },
    metadata: {
      isEmpty: false,
      hasErrors: false,
      errorMessages: []
    }
  }));

  // 分析エンジン初期化
  const analyzer = new SurveyAnalyzer(surveyResponses);
  console.log('✅ 分析エンジン初期化完了');

  // 基本統計の取得
  const basicStats = analyzer.getBasicStats();
  console.log('✅ 基本統計取得完了');
  console.log('   - 総回答数:', basicStats.totalResponses);
  console.log('   - 有効回答数:', basicStats.validResponses);
  console.log('   - 完了率:', basicStats.completionRate, '%');

  // 満足度分析
  const satisfactionAnalysis = analyzer.analyzeDistribution('salary_satisfaction');
  console.log('✅ 満足度分析完了');
  console.log('   - 平均スコア:', satisfactionAnalysis.averageScore);
  console.log('   - 満足率:', satisfactionAnalysis.satisfactionRate, '%');

  // 職種別分析
  const jobTypeAnalysis = analyzer.analyzeByJobType('job_satisfaction');
  console.log('✅ 職種別分析完了');
  console.log('   - 分析対象職種数:', Object.keys(jobTypeAnalysis).length);

} catch (error) {
  console.log('❌ 分析エンジンエラー:', error.message);
  console.log('エラー詳細:', error.stack);
}

console.log('\n');

// 4. エッジケーステスト
console.log('4️⃣ エッジケーステスト');
console.log('━━━━━━━━━━━━━━━━━');

try {
  // 空データのテスト
  const emptyResult = ExcelFormatDetector.convertToNewFormat([], []);
  console.log('✅ 空データ処理:', emptyResult === null ? 'null返却' : '予期しない結果');

  // 不正な満足度スコアのテスト
  const invalidScoreRow = ['2024-06-01', 'テスト会社', '一般社員', 'その他', '男性', '20代', '1年未満', 0, 6, -1, 'とても満足'];
  const invalidScoreHeaders = ['タイムスタンプ', '会社名', '役職', '職種', '性別', '年齢', '勤続年数', '給与や労働時間に満足している', '仕事内容に達成感があり満足を感じられる', '自分の意見を率直に言いやすい組織だ', '社員を尊重し仕事を任せ、周囲がそれを支援する組織風土がある'];
  const invalidResult = ExcelFormatDetector.convertToNewFormat(invalidScoreRow, invalidScoreHeaders);
  console.log('✅ 不正スコア処理完了');

  // ブール値変換テスト
  const booleanTests = ['はい', 'いいえ', 'Yes', 'No', 'true', 'false', '', null];
  booleanTests.forEach(value => {
    try {
      const result = ExcelFormatDetector.convertBoolean(value);
      console.log(`   - "${value}" → ${result}`);
    } catch (error) {
      console.log(`   - "${value}" → エラー: ${error.message}`);
    }
  });

} catch (error) {
  console.log('❌ エッジケーステストエラー:', error.message);
}

console.log('\n🎉 Excel解析エンジン テスト完了');