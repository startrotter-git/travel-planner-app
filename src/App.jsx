import React, { useState, useEffect } from 'react';
import { Heart, MapPin, Utensils, Clock, Wallet, Compass, Loader2, Map, Navigation, Star } from 'lucide-react';

const TravelPlannerApp = () => {
  const [step, setStep] = useState('intro');
  const [currentPerson, setCurrentPerson] = useState(1);
  const [person1Answers, setPerson1Answers] = useState({});
  const [person2Answers, setPerson2Answers] = useState({});
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationUndecided, setDestinationUndecided] = useState(false);
  const [recommendedDestinations, setRecommendedDestinations] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [additionalInfo, setAdditionalInfo] = useState({
    duration: '',
    transportation: [],
    budget: ''
  });
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [detailInfo, setDetailInfo] = useState({
    departurePlace: '',
    departureTime: '',
    stayDuration: '標準（1時間）',
    transportPriority: []
  });
  const [detailedSchedule, setDetailedSchedule] = useState(null);

  // Render.comにデプロイしたAPIサーバーのURL
  const API_BASE_URL = 'https://travel-planner-api-ird5.onrender.com';

  useEffect(() => {
    if (step === 'questions') {
      const el = document.getElementById(`question-${currentQ}`);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    }
  }, [currentQ, step, currentPerson]);

  const questions = [
    { id: 'lifestyle', question: 'アウトドア派ですか？', description: '自然の中でのアクティビティを楽しむタイプ', icon: <Heart className="w-6 h-6" />, scaleLabels: ['全くそう思わない', 'あまりそう思わない', 'どちらでもない', 'ややそう思う', 'とてもそう思う'] },
    { id: 'dining', question: '有名なお店で食事をしたいですか？', description: '評判の良い有名店を選びたい', icon: <Utensils className="w-6 h-6" />, scaleLabels: ['全くそう思わない', 'あまりそう思わない', 'どちらでもない', 'ややそう思う', 'とてもそう思う'] },
    { id: 'schedule', question: '分単位で計画を立てたいですか？', description: '予定通りに行動したい', icon: <Clock className="w-6 h-6" />, scaleLabels: ['全くそう思わない', 'あまりそう思わない', 'どちらでもない', 'ややそう思う', 'とてもそう思う'] },
    { id: 'budget', question: '費用をかけて優雅な旅がしたいですか？', description: '質や特別感を重視したい', icon: <Wallet className="w-6 h-6" />, scaleLabels: ['全くそう思わない', 'あまりそう思わない', 'どちらでもない', 'ややそう思う', 'とてもそう思う'] },
    { id: 'style', question: '王道の観光地を巡りたいですか？', description: '定番スポットを訪れたい', icon: <Compass className="w-6 h-6" />, scaleLabels: ['全くそう思わない', 'あまりそう思わない', 'どちらでもない', 'ややそう思う', 'とてもそう思う'] }
  ];

  const getScoreLabel = (s) => ['', '1: 全くそう思わない', '2: あまりそう思わない', '3: どちらでもない', '4: ややそう思う', '5: とてもそう思う'][s];

  // Google Maps APIで場所を検索する関数
  const searchPlaces = async (query, location = null) => {
    try {
      console.log(`Searching for: ${query} in ${location || 'default location'}`);
      
      const response = await fetch(`${API_BASE_URL}/api/places/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          location,
          radius: 5000
        })
      });

      const data = await response.json();
      console.log('Search results:', data);
      
      if (data.status === 'OK' && data.results) {
        // 評価順にソートして上位3件を返す
        const filteredResults = data.results
          .filter(place => place.rating && place.rating >= 3.5)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 3)
          .map(place => ({
            name: place.name,
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            address: place.formatted_address,
            placeId: place.place_id
          }));
        
        console.log('Filtered results:', filteredResults);
        return filteredResults;
      }
      return [];
    } catch (error) {
      console.error('Places search error:', error);
      return [];
    }
  };

  const recommendDestinations = async (p1, p2) => {
    setLoading(true);
    setStep('loading');
    setLoadingProgress(0);
    setLoadingMessage('分析中...');

    const int = setInterval(() => setLoadingProgress(p => Math.min(p + 10, 90)), 300);

    try {
      const res = await fetch(`${API_BASE_URL}/api/claude/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 3000,
          temperature: 0.8,
          messages: [{ role: 'user', content: `40〜50代夫婦の回答から日本国内の旅行先を3つ提案。数値は使わず言葉で。夫:${JSON.stringify(p1)} 妻:${JSON.stringify(p2)} JSON形式: {"destinations":[{"name":"","description":"","reason":""}]}` }]
        })
      });

      const data = await res.json();
      console.log('API Response:', data);
      
      const txt = data.content?.find(c => c.type === 'text')?.text || '';
      console.log('Extracted text:', txt);
      
      const match = txt.match(/\{[\s\S]*\}/);
      console.log('JSON match:', match);
      
      if (match) {
        const parsed = JSON.parse(match[0]);
        console.log('Parsed data:', parsed);
        
        clearInterval(int);
        setLoadingProgress(100);
        setLoadingMessage('完了！');
        
        setTimeout(() => {
          setRecommendedDestinations(parsed.destinations);
          setStep('selectDestination');
          setLoading(false);
        }, 500);
      } else {
        throw new Error('JSONが見つかりませんでした');
      }
    } catch (e) {
      clearInterval(int);
      console.error('Error in recommendDestinations:', e);
      alert('エラー: ' + e.message);
      setLoading(false);
      setStep('wife-complete');
    }
  };

  const generatePlans = async (p1, p2) => {
    setLoading(true);
    setStep('loading');
    setLoadingProgress(0);
    setLoadingMessage('プラン作成中...');

    [0, 1500, 3000, 4500, 6000].forEach((d, i) => {
      setTimeout(() => {
        setLoadingProgress(20 * (i + 1));
        const msgs = ['分析中...', '歴史プラン作成中...', '美食プラン作成中...', '自然プラン作成中...', '最終調整中...'];
        setLoadingMessage(msgs[i]);
      }, d);
    });

    try {
      const res = await fetch(`${API_BASE_URL}/api/claude/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 6000,
          messages: [{ role: 'user', content: `${destination}への旅行プラン3つ作成。数値使わず。夫:${JSON.stringify(p1)} 妻:${JSON.stringify(p2)} 日数:${additionalInfo.duration||'2泊3日'} 交通:${additionalInfo.transportation.join('、')||'指定なし'} 予算:${additionalInfo.budget||'標準'} テーマ:歴史/美食/自然 JSON:{"plans":[{"theme":"","title":"","description":"","days":[{"day":1,"morning":"","lunch":"","afternoon":"","dinner":""}],"accommodation":"","tips":""}]}` }]
        })
      });

      const data = await res.json();
      console.log('Plans API Response:', data);
      
      const txt = data.content?.find(c => c.type === 'text')?.text || '';
      console.log('Plans extracted text:', txt);
      
      const match = txt.match(/\{[\s\S]*\}/);
      console.log('Plans JSON match:', match);
      
      if (match) {
        const parsed = JSON.parse(match[0]);
        console.log('Plans parsed data:', parsed);
        
        if (parsed.plans && Array.isArray(parsed.plans) && parsed.plans.length > 0) {
          setLoadingProgress(100);
          setLoadingMessage('完了！');
          
          setTimeout(() => {
            setPlans(parsed.plans);
            setStep('results');
            setLoading(false);
          }, 500);
        } else {
          throw new Error('プランデータが正しくありません');
        }
      } else {
        throw new Error('JSONが見つかりませんでした');
      }
    } catch (e) {
      console.error('Error in generatePlans:', e);
      alert('プラン生成エラー: ' + e.message + '\n\nもう一度お試しください。');
      setLoading(false);
      setStep('additional');
    }
  };

  const generateDetailedSchedule = async () => {
    // バリデーション
    if (!detailInfo.departurePlace || !detailInfo.departureTime) {
      alert('出発地と出発時刻を入力してください');
      return;
    }

    setLoading(true);
    setStep('loading');
    setLoadingProgress(0);
    setLoadingMessage('詳細スケジュール作成中...');

    const progressInterval = setInterval(() => setLoadingProgress(p => Math.min(p + 3, 70)), 500);

    try {
      // ステップ1: AIで基本スケジュールを生成
      setLoadingMessage('AIでスケジュールを作成中...');
      const res = await fetch(`${API_BASE_URL}/api/claude/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 6000,
          temperature: 0.7,
          messages: [{
            role: 'user',
            content: `以下の旅行プランをもとに、時刻付きの詳細スケジュールを作成してください。

【選択されたプラン】
テーマ: ${selectedPlan.theme}
タイトル: ${selectedPlan.title}
${selectedPlan.days.map((d) => `
${d.day}日目:
- 午前: ${d.morning}
- ランチ: ${d.lunch}
- 午後: ${d.afternoon}
- ディナー: ${d.dinner}
`).join('\n')}

【詳細情報】
- 出発地: ${detailInfo.departurePlace}
- 目的地: ${destination}
- 初日出発時刻: ${detailInfo.departureTime}
- 各スポット滞在時間: ${detailInfo.stayDuration}
- 移動手段優先順位: ${detailInfo.transportPriority.join('、') || '指定なし'}

【重要な制約事項】
1. 食事時間の制約（必ず守ること）:
   - 朝食: 基本8:00、遅くとも10:00まで
   - 昼食: 基本12:00、遅くとも14:00まで
   - 夕食: 基本18:00、遅くとも20:00まで
   - 各食事の間隔は必ず4時間以上空ける
   - 例: 12:00に昼食なら、夕食は16:00以降（できれば18:00）

2. 公共交通機関を使用する場合は、実在する具体的な列車名・便名を記載してください
   例: 
   - 新幹線: のぞみ123号、ひかり456号、こだま789号
   - 飛行機: ANA456便、JAL789便
   - 在来線: 特急サンダーバード、特急はるか
   
3. 出発時刻から順番に、各アクティビティの開始・終了時刻を計算してください

4. 移動時間を現実的に見積もってください（新幹線、飛行機の実際の所要時間を考慮）

5. 各スポットでの滞在時間を指定された時間に基づいて考慮してください

6. 食事場所は具体的なエリア名や料理のジャンルを記載してください
   例: "${destination} 駅周辺 和食" "${destination} 繁華街 イタリアン"
   
7. 宿泊施設は具体的なエリア名とタイプを記載してください
   例: "${destination}駅周辺 ホテル" "${destination}温泉街 旅館"

必ずJSON形式で返してください:
{
  "detailedSchedule": {
    "destination": "${destination}",
    "theme": "${selectedPlan.theme}",
    "days": [
      {
        "day": 1,
        "date": "1日目",
        "activities": [
          {
            "time": "09:00",
            "type": "departure",
            "title": "出発",
            "description": "${detailInfo.departurePlace}を出発",
            "duration": "0分"
          },
          {
            "time": "09:10",
            "type": "travel",
            "title": "移動",
            "description": "${detailInfo.departurePlace} → ${destination}",
            "duration": "2時間20分",
            "transportation": "東海道新幹線のぞみ123号",
            "trainName": "のぞみ123号"
          },
          {
            "time": "11:30",
            "type": "activity",
            "title": "観光スポット名",
            "description": "具体的な活動内容",
            "duration": "1時間"
          },
          {
            "time": "12:00",
            "type": "meal",
            "title": "ランチ",
            "description": "${destination}の名物料理を楽しむ",
            "duration": "1時間",
            "searchQuery": "${destination} ランチ おすすめ",
            "mealType": "lunch"
          },
          {
            "time": "18:00",
            "type": "meal",
            "title": "ディナー",
            "description": "${destination}の郷土料理",
            "duration": "2時間",
            "searchQuery": "${destination} ディナー 郷土料理",
            "mealType": "dinner"
          },
          {
            "time": "20:00",
            "type": "accommodation",
            "title": "宿泊",
            "description": "${destination}駅周辺のホテル",
            "searchQuery": "${destination} ホテル",
            "accommodationType": "hotel"
          }
        ]
      }
    ]
  }
}`
          }]
        })
      });

      const data = await res.json();
      console.log('Detailed Schedule API Response:', data);
      
      const txt = data.content?.find(c => c.type === 'text')?.text || '';
      const match = txt.match(/\{[\s\S]*\}/);
      
      if (!match) {
        throw new Error('JSONが見つかりませんでした');
      }

      const parsed = JSON.parse(match[0]);
      console.log('Parsed detailed schedule:', parsed);

      clearInterval(progressInterval);
      setLoadingProgress(75);
      setLoadingMessage('レストランとホテルを検索中...');

      // ステップ2: Google Maps APIで食事場所とホテルを検索
      const enhancedSchedule = { ...parsed.detailedSchedule };
      
      for (const day of enhancedSchedule.days) {
        for (const activity of day.activities) {
          if ((activity.type === 'meal' || activity.type === 'accommodation') && activity.searchQuery) {
            console.log(`Searching for activity: ${activity.title}, query: ${activity.searchQuery}`);
            try {
              const places = await searchPlaces(activity.searchQuery, destination);
              console.log(`Found ${places.length} places for ${activity.title}`);
              if (places && places.length > 0) {
                activity.placeOptions = places;
                console.log('Added placeOptions to activity:', activity);
              } else {
                console.log('No places found for:', activity.searchQuery);
              }
            } catch (error) {
              console.error(`Error searching for ${activity.searchQuery}:`, error);
            }
          }
        }
      }

      console.log('Final enhanced schedule:', enhancedSchedule);

      setLoadingProgress(100);
      setLoadingMessage('完了！');
      
      setTimeout(() => {
        setDetailedSchedule(enhancedSchedule);
        setStep('detailed-schedule');
        setLoading(false);
      }, 500);
      
    } catch (e) {
      clearInterval(progressInterval);
      console.error('Error in generateDetailedSchedule:', e);
      alert('詳細スケジュール生成エラー: ' + e.message);
      setLoading(false);
      setStep('detail-input');
    }
  };

  const resetApp = () => {
    setStep('intro');
    setCurrentPerson(1);
    setCurrentQ(0);
    setPerson1Answers({});
    setPerson2Answers({});
    setPlans(null);
    setDestination('');
    setDestinationUndecided(false);
    setRecommendedDestinations(null);
    setAdditionalInfo({ duration: '', transportation: [], budget: '' });
    setSelectedPlan(null);
    setDetailInfo({ departurePlace: '', departureTime: '', stayDuration: '標準（1時間）', transportPriority: [] });
    setDetailedSchedule(null);
  };

  // アクティビティタイプに応じたアイコンとカラーを返す関数
  const getActivityStyle = (type) => {
    const styles = {
      departure: { icon: '🚀', color: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
      travel: { icon: '🚗', color: 'purple', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
      activity: { icon: '🎯', color: 'green', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
      meal: { icon: '🍽️', color: 'orange', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
      accommodation: { icon: '🏨', color: 'pink', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
      default: { icon: '📍', color: 'gray', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' }
    };
    return styles[type] || styles.default;
  };

  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-800 mb-4">お二人の旅行プランナー</h1>
            <p className="text-gray-600 text-lg">お二人の好みに合わせた、最高の旅行プランを作成します</p>
          </div>
          <div className="space-y-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-xl">
              <h3 className="font-semibold text-blue-900 mb-2">📝 簡単5つの質問</h3>
              <p className="text-sm text-blue-700">お二人それぞれに5つの質問にお答えいただきます</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl">
              <h3 className="font-semibold text-green-900 mb-2">🎯 ピッタリのプラン</h3>
              <p className="text-sm text-green-700">回答をもとに、3つのテーマ別プランをご提案</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl">
              <h3 className="font-semibold text-purple-900 mb-2">⏰ 詳細スケジュール</h3>
              <p className="text-sm text-purple-700">時刻付きの具体的なスケジュールも作成可能</p>
            </div>
          </div>
          <button 
            onClick={() => setStep('questions')}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-indigo-700 transition shadow-lg"
          >
            はじめる
          </button>
        </div>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-6 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{loadingMessage}</h2>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-gray-600">{loadingProgress}%</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'questions') {
    const currentAnswers = currentPerson === 1 ? person1Answers : person2Answers;
    const setCurrentAnswers = currentPerson === 1 ? setPerson1Answers : setPerson2Answers;
    const allAnswered = questions.every(q => currentAnswers[q.id]);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 sticky top-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {currentPerson === 1 ? '👨 ご主人' : '👩 奥様'}の好みを教えてください
                </h2>
                <p className="text-gray-600 mt-1">5段階で評価してください</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">質問</div>
                <div className="text-2xl font-bold text-blue-600">{Object.keys(currentAnswers).length}/{questions.length}</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(Object.keys(currentAnswers).length / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-6 mb-24">
            {questions.map((q, idx) => {
              const answered = currentAnswers[q.id] !== undefined;
              return (
                <div 
                  key={q.id}
                  id={`question-${idx}`}
                  className={`bg-white rounded-2xl shadow-xl p-6 transition-all duration-300 ${
                    answered ? 'opacity-60' : 'opacity-100'
                  }`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-blue-500 mt-1">{q.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{q.question}</h3>
                      <p className="text-gray-600 text-sm">{q.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(score => (
                      <button
                        key={score}
                        onClick={() => {
                          setCurrentAnswers(prev => ({ ...prev, [q.id]: score }));
                          if (idx < questions.length - 1) {
                            setTimeout(() => setCurrentQ(idx + 1), 300);
                          }
                        }}
                        className={`w-full p-4 rounded-xl border-2 transition text-left ${
                          currentAnswers[q.id] === score
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                            : 'border-gray-200 hover:border-blue-300 text-gray-700'
                        }`}
                      >
                        <span className="font-bold mr-2">{score}</span>
                        {q.scaleLabels[score - 1]}
                      </button>
                    ))}
                  </div>

                  {answered && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">
                        ✓ 回答済み: {getScoreLabel(currentAnswers[q.id])}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {allAnswered && (
            <div className="fixed bottom-6 left-0 right-0 px-6 max-w-3xl mx-auto">
              <button
                onClick={() => {
                  if (currentPerson === 1) {
                    setCurrentPerson(2);
                    setCurrentQ(0);
                    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                  } else {
                    setStep('wife-complete');
                  }
                }}
                className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-4 rounded-xl font-semibold text-lg shadow-2xl hover:from-green-600 hover:to-teal-700 transition"
              >
                {currentPerson === 1 ? '次へ：奥様の回答' : '回答完了'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'wife-complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">回答完了！</h2>
            <p className="text-gray-600 mb-6">お二人の好みがわかりました。次に旅行先を決めましょう。</p>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl">
              <h3 className="font-semibold text-lg mb-3 text-gray-800">旅行先は決まっていますか？</h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setDestinationUndecided(false);
                    setStep('destination');
                  }}
                  className="w-full bg-white border-2 border-blue-500 text-blue-700 py-3 rounded-xl font-semibold hover:bg-blue-50 transition"
                >
                  はい、行き先が決まっています
                </button>
                <button
                  onClick={() => {
                    setDestinationUndecided(true);
                    recommendDestinations(person1Answers, person2Answers);
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition"
                >
                  いいえ、おすすめを提案してほしい
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'destination') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <MapPin className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-4">旅行先を教えてください</h2>
            <p className="text-gray-600">行きたい場所を入力してください</p>
          </div>

          <div className="space-y-6">
            <div>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="例：京都、沖縄、北海道"
                className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => destination ? setStep('additional') : alert('旅行先を入力してください')}
              disabled={!destination}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-indigo-700 transition"
            >
              次へ
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'selectDestination' && recommendedDestinations) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">おすすめの旅行先</h2>
            <p className="text-gray-600">お二人にぴったりの場所を3つ選びました</p>
          </div>

          <div className="grid gap-6 mb-6">
            {recommendedDestinations.map((dest, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition">
                <h3 className="text-2xl font-bold text-blue-600 mb-3">{dest.name}</h3>
                <p className="text-gray-700 mb-4">{dest.description}</p>
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-blue-700"><strong>おすすめの理由：</strong> {dest.reason}</p>
                </div>
                <button
                  onClick={() => {
                    setDestination(dest.name);
                    setStep('additional');
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition"
                >
                  {dest.name}に決定
                </button>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => setStep('destination')}
              className="bg-gray-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-600 transition"
            >
              他の場所を入力する
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'additional') {
    const durationOptions = ['日帰り', '1泊2日', '2泊3日', '3泊4日', '4泊5日以上'];
    const transportOptions = ['新幹線', '飛行機', '車', 'バス', 'フェリー'];
    const budgetOptions = ['節約（1人2万円以下/泊）', '標準（1人2-4万円/泊）', '贅沢（1人4万円以上/泊）'];

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <Compass className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">旅行の詳細</h2>
            <p className="text-gray-600 mb-2">いくつか追加情報を教えてください</p>
            <div className="inline-block bg-blue-50 px-4 py-2 rounded-lg">
              <p className="text-sm font-semibold text-blue-700">行き先: {destination}</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">日数</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {durationOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setAdditionalInfo(prev => ({ ...prev, duration: option }))}
                    className={`p-4 border-2 rounded-xl font-medium transition ${
                      additionalInfo.duration === option
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300 text-gray-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">移動手段（複数選択可）</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {transportOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setAdditionalInfo(prev => ({
                        ...prev,
                        transportation: prev.transportation.includes(option)
                          ? prev.transportation.filter(t => t !== option)
                          : [...prev.transportation, option]
                      }));
                    }}
                    className={`p-4 border-2 rounded-xl font-medium transition ${
                      additionalInfo.transportation.includes(option)
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-300 text-gray-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">予算感</h3>
              <div className="grid gap-3">
                {budgetOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setAdditionalInfo(prev => ({ ...prev, budget: option }))}
                    className={`p-4 border-2 rounded-xl font-medium transition text-left ${
                      additionalInfo.budget === option
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-purple-300 text-gray-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => generatePlans(person1Answers, person2Answers)}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-indigo-700 transition"
            >
              プランを作成
            </button>
            <button
              onClick={() => setStep(destinationUndecided ? 'selectDestination' : 'destination')}
              className="w-full bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'results' && plans) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 text-center">
            <h1 className="text-3xl font-bold mb-2">🎉 {destination}への旅行プラン完成！</h1>
            <p className="text-gray-600">お二人にぴったりの3つのプラン</p>
          </div>
          <div className="grid gap-6 mb-6">
            {plans.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                  <h2 className="text-2xl font-bold mb-2">{p.theme}</h2>
                  <p className="text-blue-100">{p.title}</p>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 mb-6">{p.description}</p>
                  <div className="grid gap-6 mb-6">
                    {(p.days || []).map((d, j) => (
                      <div key={j} className={`border-2 rounded-lg p-4 ${['border-blue-100', 'border-green-100', 'border-purple-100', 'border-pink-100'][j]}`}>
                        <h3 className={`font-bold text-lg mb-3 ${['text-blue-700', 'text-green-700', 'text-purple-700', 'text-pink-700'][j]}`}>📅 {d.day}日目</h3>
                        <div className="space-y-3 text-sm">
                          <div><span className="font-semibold">午前:</span><p className="text-gray-600 ml-2">{d.morning}</p></div>
                          <div><span className="font-semibold">ランチ:</span><p className="text-gray-600 ml-2">{d.lunch}</p></div>
                          <div><span className="font-semibold">午後:</span><p className="text-gray-600 ml-2">{d.afternoon}</p></div>
                          <div><span className="font-semibold">ディナー:</span><p className="text-gray-600 ml-2">{d.dinner}</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold mb-2">🏨 宿泊施設</h4>
                    <p className="text-sm">{p.accommodation}</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold mb-2">💡 旅のアドバイス</h4>
                    <p className="text-sm">{p.tips}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedPlan(p);
                      setStep('detail-input');
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-teal-700 transition"
                  >
                    このプランで詳細なスケジュールを作成
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center"><button onClick={resetApp} className="bg-gray-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-700 transition">新しいプランを作成</button></div>
        </div>
      </div>
    );
  }

  if (step === 'detail-input') {
    const transportOptions = ['電車優先', '車優先', '徒歩多め', '時間優先', '費用優先'];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <Clock className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">詳細スケジュールの作成</h2>
            <p className="text-gray-600 mb-2">より具体的なスケジュールを作成します</p>
            <div className="inline-block bg-blue-50 px-4 py-2 rounded-lg">
              <p className="text-sm font-semibold text-blue-700">選択プラン: {selectedPlan?.theme}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-500" />
                出発地
              </h3>
              <input
                type="text"
                value={detailInfo.departurePlace}
                onChange={(e) => setDetailInfo(prev => ({ ...prev, departurePlace: e.target.value }))}
                placeholder="例: 東京駅、自宅の住所、羽田空港"
                className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg focus:border-green-500 focus:outline-none"
              />
              <p className="text-sm text-gray-500 mt-2">※ 駅名、住所、空港名などを入力</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-green-500" />
                初日の出発時刻
              </h3>
              <input
                type="time"
                value={detailInfo.departureTime}
                onChange={(e) => setDetailInfo(prev => ({ ...prev, departureTime: e.target.value }))}
                className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg focus:border-green-500 focus:outline-none"
              />
              <p className="text-sm text-gray-500 mt-2">※ 旅行初日に出発地を出る時刻</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Compass className="w-5 h-5 mr-2 text-purple-500" />
                各スポットでの滞在時間
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {['短め（30分）', '標準（1時間）', '長め（2時間）'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setDetailInfo(prev => ({ ...prev, stayDuration: option }))}
                    className={`p-4 border-2 rounded-xl font-medium transition ${
                      detailInfo.stayDuration === option
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-purple-300 text-gray-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Navigation className="w-5 h-5 mr-2 text-orange-500" />
                移動手段の優先順位（複数選択可）
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {transportOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setDetailInfo(prev => ({
                        ...prev,
                        transportPriority: prev.transportPriority.includes(option)
                          ? prev.transportPriority.filter(t => t !== option)
                          : [...prev.transportPriority, option]
                      }));
                    }}
                    className={`p-4 border-2 rounded-xl font-medium transition flex items-center justify-center ${
                      detailInfo.transportPriority.includes(option)
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-orange-300 text-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={detailInfo.transportPriority.includes(option)}
                      onChange={() => {}}
                      className="mr-2"
                    />
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={generateDetailedSchedule}
              className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-teal-700 transition"
            >
              詳細スケジュールを生成
            </button>
            <button
              onClick={() => setStep('results')}
              className="w-full bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition"
            >
              プラン一覧に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'detailed-schedule' && detailedSchedule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 text-center">
            <Clock className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">⏰ 詳細スケジュール</h1>
            <div className="flex items-center justify-center gap-4 text-gray-600 flex-wrap">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{detailedSchedule.destination}</span>
              </div>
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5" />
                <span>{detailedSchedule.theme}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6 mb-6">
            {detailedSchedule.days.map((day, dayIndex) => (
              <div key={dayIndex} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className={`p-6 text-white ${
                  ['bg-gradient-to-r from-blue-500 to-indigo-600',
                   'bg-gradient-to-r from-green-500 to-teal-600',
                   'bg-gradient-to-r from-purple-500 to-pink-600'][dayIndex % 3]
                }`}>
                  <h2 className="text-2xl font-bold">📅 {day.date}</h2>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {day.activities.map((activity, actIndex) => {
                      const style = getActivityStyle(activity.type);
                      return (
                        <div key={actIndex} className={`border-2 ${style.border} ${style.bg} rounded-xl p-5 transition hover:shadow-md`}>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className={`w-16 h-16 rounded-full ${style.bg} border-2 ${style.border} flex items-center justify-center text-2xl`}>
                                {style.icon}
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                <div>
                                  <span className={`text-2xl font-bold ${style.text}`}>{activity.time}</span>
                                  <span className="ml-3 text-sm text-gray-500">({activity.duration})</span>
                                </div>
                                {activity.transportation && (
                                  <span className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700">
                                    {activity.transportation}
                                  </span>
                                )}
                              </div>
                              
                              <h3 className={`text-xl font-bold mb-2 ${style.text}`}>{activity.title}</h3>
                              <p className="text-gray-700 leading-relaxed mb-3">{activity.description}</p>

                              {/* 食事・宿泊の候補表示 */}
                              {activity.placeOptions && activity.placeOptions.length > 0 && (
                                <div className="mt-4 space-y-3">
                                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    おすすめの{activity.type === 'meal' ? 'レストラン' : 'ホテル'}
                                  </h4>
                                  <div className="space-y-2">
                                    {activity.placeOptions.map((place, placeIndex) => (
                                      <div key={placeIndex} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1">
                                            <h5 className="font-semibold text-gray-900">{place.name}</h5>
                                            <p className="text-xs text-gray-500 mt-1">{place.address}</p>
                                          </div>
                                          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md flex-shrink-0">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            <span className="font-semibold text-sm text-gray-800">{place.rating}</span>
                                            <span className="text-xs text-gray-500">({place.userRatingsTotal})</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setStep('results')}
              className="bg-gray-500 text-white py-4 rounded-xl font-semibold hover:bg-gray-600 transition"
            >
              プラン一覧に戻る
            </button>
            <button
              onClick={resetApp}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition"
            >
              新しいプランを作成
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TravelPlannerApp;
