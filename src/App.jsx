import React, { useState, useEffect } from 'react';
import { Heart, MapPin, Utensils, Clock, Wallet, Compass, Loader2, Navigation, Star, Users, User, Baby, UserPlus } from 'lucide-react';

const TravelPlannerApp = () => {
  const [step, setStep] = useState('intro');
  const [travelGroup, setTravelGroup] = useState({
    type: '',
    memberCount: 2,
    members: [],
    hasChildren: false,
    hasTeens: false,
    hasSeniors: false
  });
  const [currentMemberIndex, setCurrentMemberIndex] = useState(0);
  const [memberAnswers, setMemberAnswers] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationUndecided, setDestinationUndecided] = useState(false);
  const [recommendedDestinations, setRecommendedDestinations] = useState(null);
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

  const [fontSize, setFontSize] = useState('medium'); // 'small', 'medium', 'large'

  // Render.comにデプロイしたAPIサーバーのURL
  const API_BASE_URL = 'https://travel-planner-api-ird5.onrender.com';

  useEffect(() => {
    if (step === 'questions') {
      const el = document.getElementById(`question-${currentQ}`);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    }
  }, [currentQ, step, currentMemberIndex]);

  const questions = [
    { id: 'lifestyle', question: 'アウトドア派ですか？', description: '自然の中でのアクティビティを楽しむタイプ', icon: <Heart className="w-6 h-6" />, scaleLabels: ['全くそう思わない', 'あまりそう思わない', 'どちらでもない', 'ややそう思う', 'とてもそう思う'] },
    { id: 'dining', question: '有名なお店で食事をしたいですか？', description: '評判の良い有名店を選びたい', icon: <Utensils className="w-6 h-6" />, scaleLabels: ['全くそう思わない', 'あまりそう思わない', 'どちらでもない', 'ややそう思う', 'とてもそう思う'] },
    { id: 'schedule', question: '分単位で計画を立てたいですか？', description: '予定通りに行動したい', icon: <Clock className="w-6 h-6" />, scaleLabels: ['全くそう思わない', 'あまりそう思わない', 'どちらでもない', 'ややそう思う', 'とてもそう思う'] },
    { id: 'budget', question: '費用をかけて優雅な旅がしたいですか？', description: '質や特別感を重視したい', icon: <Wallet className="w-6 h-6" />, scaleLabels: ['全くそう思わない', 'あまりそう思わない', 'どちらでもない', 'ややそう思う', 'とてもそう思う'] },
    { id: 'style', question: '王道の観光地を巡りたいですか？', description: '定番スポットを訪れたい', icon: <Compass className="w-6 h-6" />, scaleLabels: ['全くそう思わない', 'あまりそう思わない', 'どちらでもない', 'ややそう思う', 'とてもそう思う'] }
  ];

  const getScoreLabel = (s) => ['', '1: 全くそう思わない', '2: あまりそう思わない', '3: どちらでもない', '4: ややそう思う', '5: とてもそう思う'][s];
  const getFontSizeClasses = () => {
    const sizes = {
      small: {
        text: 'text-sm',
        heading: 'text-lg',
        subheading: 'text-base',
        label: 'text-xs',
        button: 'text-sm'
      },
      medium: {
        text: 'text-base',
        heading: 'text-2xl',
        subheading: 'text-lg',
        label: 'text-sm',
        button: 'text-base'
      },
      large: {
        text: 'text-lg',
        heading: 'text-3xl',
        subheading: 'text-xl',
        label: 'text-base',
        button: 'text-lg'
      }
    };
    return sizes[fontSize];
  };
   const initializeTravelGroup = (type, count = 2) => {
    const members = [];
    
    if (type === 'couple') {
      members.push({ name: 'お一人目', ageGroup: '40-50代' });
      members.push({ name: 'お二人目', ageGroup: '40-50代' });
    } else if (type === 'family') {
      for (let i = 0; i < count; i++) {
        members.push({ name: `メンバー${i + 1}`, ageGroup: '40-50代' });
      }
    } else if (type === 'friends') {
      for (let i = 0; i < count; i++) {
        members.push({ name: `メンバー${i + 1}`, ageGroup: '20-30代' });
      }
    } else if (type === 'solo') {
      members.push({ name: 'あなた', ageGroup: '40-50代' });
    }
    
    setTravelGroup({ type, memberCount: count, members });
    setMemberAnswers(new Array(members.length).fill(null).map(() => ({})));
  };
  
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
   const getRouteInfo = async (origin, destination, departureTime) => {
    try {
      console.log(`Getting route from ${origin} to ${destination}`);
      
      const response = await fetch(`${API_BASE_URL}/api/directions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          mode: 'transit',
          departure_time: departureTime
        })
      });

      const data = await response.json();
      console.log('Directions API response:', data);
      
      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        // 移動ステップを抽出
        const steps = leg.steps.map(step => {
          let transportMode = '徒歩';
          let transportDetails = '';
          
          if (step.travel_mode === 'TRANSIT') {
            const transit = step.transit_details;
            if (transit) {
              // 路線名を取得（例: JR東海道新幹線）
              transportMode = transit.line.vehicle.type === 'HEAVY_RAIL' ? '鉄道' :
                             transit.line.vehicle.type === 'HIGH_SPEED_TRAIN' ? '新幹線' :
                             transit.line.vehicle.type === 'BUS' ? 'バス' : '公共交通機関';
              
              transportDetails = `${transit.line.name || transit.line.short_name || ''}`;
              
              // 出発駅・到着駅
              const fromStation = transit.departure_stop.name;
              const toStation = transit.arrival_stop.name;
              
              return {
                mode: transportMode,
                details: transportDetails,
                from: fromStation,
                to: toStation,
                duration: step.duration.text,
                durationValue: step.duration.value
              };
            }
          }
          
          return {
            mode: transportMode,
            details: '',
            duration: step.duration.text,
            durationValue: step.duration.value
          };
        }).filter(step => step.mode !== '徒歩' || step.durationValue > 300); // 5分以上の徒歩のみ含める
        
        return {
          duration: leg.duration.text,
          durationValue: leg.duration.value,
          distance: leg.distance.text,
          steps: steps
        };
      }
      
      return null;
    } catch (error) {
      console.error('Route info error:', error);
      return null;
    }
  };

  const recommendDestinations = async () => {
    setLoading(true);
    setStep('loading');
    setLoadingProgress(0);
    setLoadingMessage('分析中...');

    const int = setInterval(() => setLoadingProgress(p => Math.min(p + 10, 90)), 300);

    try {
      const membersInfo = travelGroup.members.map((member, idx) => ({
        name: member.name,
        ageGroup: member.ageGroup,
        answers: memberAnswers[idx]
      }));

      const groupType = travelGroup.type === 'couple' ? '夫婦・カップル' : 
                        travelGroup.type === 'family' ? '家族' : 
                        travelGroup.type === 'friends' ? '友人グループ' : '一人旅';

      const membersText = membersInfo.map((m, i) => `${m.name}（${m.ageGroup}）: ${JSON.stringify(m.answers)}`).join(', ');
      const groupDetails = travelGroup.hasChildren ? '小学生以下の子供が含まれます。' : 
                           travelGroup.hasTeens ? '中高生が含まれます。' : 
                           travelGroup.hasSeniors ? 'シニア（60代以上）が含まれます。' : '';
      const prompt = `以下の旅行グループに最適な日本国内の旅行先を3つ提案してください。グループ構成 - タイプ: ${groupType}, 人数: ${travelGroup.memberCount}名。${groupDetails} 各メンバーの回答: ${membersText}。全員が楽しめる場所を選び、年齢層や構成に適した施設・アクティビティを含めてください。JSON形式で返してください: {"destinations":[{"name":"地名","description":"200文字程度の説明","reason":"このグループに適している理由"}]}`;
      const res = await fetch(`${API_BASE_URL}/api/claude/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          temperature: 0.8,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await res.json();
      console.log('API Response:', data);
      
      const txt = data.content?.find(c => c.type === 'text')?.text || '';
      const match = txt.match(/\{[\s\S]*\}/);
      
      if (match) {
        const parsed = JSON.parse(match[0]);
        
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
      setStep('member-complete');
    }
  };

const generatePlans = async () => {
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
      const membersInfo = travelGroup.members.map((member, idx) => ({
        name: member.name,
        ageGroup: member.ageGroup,
        answers: memberAnswers[idx]
      }));

      const groupType = travelGroup.type === 'couple' ? '夫婦・カップル' : 
                        travelGroup.type === 'family' ? '家族' : 
                        travelGroup.type === 'friends' ? '友人グループ' : '一人旅';

      const membersText = membersInfo.map((m) => `${m.name}（${m.ageGroup}）: ${JSON.stringify(m.answers)}`).join(', ');
      const groupDetails = travelGroup.hasChildren ? '小学生以下の子供が含まれます（早めの食事時間、長時間移動を避ける）。' : 
                          travelGroup.hasTeens ? '中高生が含まれます。' : 
                          travelGroup.hasSeniors ? 'シニアが含まれます（ゆったりペース、休憩多め）。' : '';
      
      const prompt = `${destination}への旅行プランを3つ作成してください。グループ構成 - タイプ: ${groupType}, 人数: ${travelGroup.memberCount}名。${groupDetails} 各メンバーの好み: ${membersText}。旅行詳細 - 日数: ${additionalInfo.duration || '2泊3日'}, 交通手段: ${additionalInfo.transportation.join('、') || '指定なし'}, 予算: ${additionalInfo.budget || '標準'}。全員が楽しめる要素をバランスよく配置し、年齢層に適した活動内容にしてください。3つのテーマ: 1.歴史・文化探訪コース, 2.美食満喫コース, 3.自然体験コース。JSON形式: {"plans":[{"theme":"テーマ名","title":"プランタイトル","description":"プラン説明","days":[{"day":1,"morning":"午前の活動","lunch":"ランチ内容","afternoon":"午後の活動","dinner":"ディナー内容"}],"accommodation":"宿泊施設の説明","tips":"旅のアドバイス"}]}`;
      const res = await fetch(`${API_BASE_URL}/api/claude/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await res.json();
      const txt = data.content?.find(c => c.type === 'text')?.text || '';
      const match = txt.match(/\{[\s\S]*\}/);
      
      if (match) {
        const parsed = JSON.parse(match[0]);
        
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
      alert('プラン生成エラー: ' + e.message);
      setLoading(false);
      setStep('additional');
    }
  };

const generateDetailedSchedule = async () => {
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
    setLoadingMessage('AIでスケジュールを作成中...');
    
    const groupType = travelGroup.type === 'couple' ? '夫婦・カップル' : 
                      travelGroup.type === 'family' ? '家族' : 
                      travelGroup.type === 'friends' ? '友人グループ' : '一人旅';
    
    const groupDetails = [];
    if (travelGroup.hasChildren) groupDetails.push('小学生以下の子供あり（早めの食事時間17:30頃、長時間移動を避ける）');
    if (travelGroup.hasTeens) groupDetails.push('中高生あり');
    if (travelGroup.hasSeniors) groupDetails.push('シニアあり（ゆったりペース、休憩多め）');
    
    const daysText = selectedPlan.days.map((d) => 
      `${d.day}日目: 午前: ${d.morning}, ランチ: ${d.lunch}, 午後: ${d.afternoon}, ディナー: ${d.dinner}`
    ).join('\n');

    const prompt = `以下の旅行プランをもとに、時刻付きの詳細スケジュールを作成してください。

【選択されたプラン】
テーマ: ${selectedPlan.theme}
タイトル: ${selectedPlan.title}
${daysText}

【グループ情報】
- 構成: ${groupType}
- 人数: ${travelGroup.memberCount}名
${groupDetails.length > 0 ? `- 特記事項: ${groupDetails.join('、')}` : ''}

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
   ${travelGroup.hasChildren ? '- 子供がいる場合は夕食を17:30頃に早める' : ''}
   - 各食事の間隔は必ず4時間以上空ける

2. 公共交通機関については、実際の経路情報を別途取得するため、ここでは移動時間の見積もりのみ記載してください。
   列車名や便名は記載不要です。

3. 移動時間を現実的に見積もる（渋滞・乗り換え時間を考慮）

4. 食事場所は「${destination} + エリア名 + 料理ジャンル」形式で記載してください。
   良い例: "${destination} 駅周辺 和食"、"${destination} 繁華街 イタリアン"、"${destination} 旧市街 京料理"
   悪い例: "レストラン"、"有名店"、"おすすめ"

5. 宿泊施設は「${destination} + エリア名 + 施設タイプ」形式で記載してください。
   良い例: "${destination}駅周辺 ホテル"、"${destination}温泉街 旅館"
   悪い例: "宿泊施設"、"ホテル"

JSON形式で返してください:
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
            "transportation": "東海道新幹線のぞみ123号"
          },
          {
            "time": "12:00",
            "type": "meal",
            "title": "ランチ",
            "description": "料理の説明",
            "duration": "1時間",
            "searchQuery": "${destination} 駅周辺 ランチ"
          },
          {
            "time": "13:00",
            "type": "activity",
            "title": "観光",
            "description": "観光スポットの説明",
            "duration": "1時間"
          },
          {
            "time": "18:00",
            "type": "meal",
            "title": "ディナー",
            "description": "料理の説明",
            "duration": "2時間",
            "searchQuery": "${destination} 繁華街 ディナー"
          },
          {
            "time": "20:00",
            "type": "accommodation",
            "title": "宿泊",
            "description": "宿泊施設の説明",
            "searchQuery": "${destination}駅周辺 ホテル"
          }
        ]
      }
    ]
  }
}`;

    const res = await fetch(`${API_BASE_URL}/api/claude/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await res.json();
    const txt = data.content?.find(c => c.type === 'text')?.text || '';
    const match = txt.match(/\{[\s\S]*\}/);
    
    if (!match) {
      throw new Error('JSONが見つかりませんでした');
    }

    const parsed = JSON.parse(match[0]);

    clearInterval(progressInterval);
    setLoadingProgress(75);
    setLoadingMessage('レストランとホテルを検索中...');

    const enhancedSchedule = { ...parsed.detailedSchedule };
    console.log('Fetching route information...');
      const routeInfo = await getRouteInfo(detailInfo.departurePlace, destination, detailInfo.departureTime);
      
      if (routeInfo && routeInfo.steps.length > 0) {
        console.log('Route info obtained:', routeInfo);
        
        // 最初の日の移動アクティビティを実際の経路に置き換え
        if (enhancedSchedule.days && enhancedSchedule.days.length > 0) {
          const firstDay = enhancedSchedule.days[0];
          const travelActivityIndex = firstDay.activities.findIndex(a => a.type === 'travel');
          
          if (travelActivityIndex !== -1) {
            // 実際の経路ステップを追加
            const newActivities = [...firstDay.activities];
            
            // 元の移動アクティビティを削除
            newActivities.splice(travelActivityIndex, 1);
            
            // 実際の経路ステップを挿入
            let currentTime = detailInfo.departureTime;
            routeInfo.steps.forEach((step, idx) => {
              const [hours, minutes] = currentTime.split(':').map(Number);
              const startMinutes = hours * 60 + minutes;
              
              const stepActivity = {
                time: currentTime,
                type: 'travel',
                title: step.mode,
                description: step.details ? 
                  `${step.details}（${step.from} → ${step.to}）` : 
                  `${step.from || detailInfo.departurePlace} → ${step.to || destination}`,
                duration: step.duration,
                transportation: step.details || step.mode
              };
              
              newActivities.splice(travelActivityIndex + idx, 0, stepActivity);
              
              // 次のステップの開始時刻を計算
              const endMinutes = startMinutes + Math.ceil(step.durationValue / 60);
              const endHours = Math.floor(endMinutes / 60);
              const endMins = endMinutes % 60;
              currentTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
            });
            
            // 到着後のアクティビティの時刻を調整
            const [lastHours, lastMinutes] = currentTime.split(':').map(Number);
            let adjustedMinutes = lastHours * 60 + lastMinutes;
            
            for (let i = travelActivityIndex + routeInfo.steps.length; i < newActivities.length; i++) {
              const [actHours, actMinutes] = newActivities[i].time.split(':').map(Number);
              const actTotalMinutes = actHours * 60 + actMinutes;
              
              if (actTotalMinutes < adjustedMinutes) {
                // 時刻を調整
                const newHours = Math.floor(adjustedMinutes / 60);
                const newMins = adjustedMinutes % 60;
                newActivities[i].time = `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
              }
              
              // 次のアクティビティのために時刻を更新
              const durationMatch = newActivities[i].duration?.match(/(\d+)/);
              if (durationMatch) {
                adjustedMinutes += parseInt(durationMatch[1]);
              }
            }
            
            firstDay.activities = newActivities;
          }
        }
      } else {
        console.log('No route info available, using AI-generated schedule');
      }
    
    for (const day of enhancedSchedule.days) {
      for (const activity of day.activities) {
        if ((activity.type === 'meal' || activity.type === 'accommodation') && activity.searchQuery) {
          try {
            console.log(`Searching for: ${activity.searchQuery}`);
            const places = await searchPlaces(activity.searchQuery, destination);
            if (places && places.length > 0) {
              activity.placeOptions = places;
              console.log(`Found ${places.length} places for ${activity.searchQuery}`);
            } else {
              console.log(`No places found for ${activity.searchQuery}`);
            }
          } catch (error) {
            console.error(`Error searching for ${activity.searchQuery}:`, error);
          }
        }
      }
    }

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
    setTravelGroup({ type: '', memberCount: 2, members: [], hasChildren: false, hasTeens: false, hasSeniors: false });
    setCurrentMemberIndex(0);
    setMemberAnswers([]);
    setCurrentQ(0);
    setPlans(null);
    setDestination('');
    setDestinationUndecided(false);
    setRecommendedDestinations(null);
    setAdditionalInfo({ duration: '', transportation: [], budget: '' });
    setSelectedPlan(null);
    setDetailInfo({ departurePlace: '', departureTime: '', stayDuration: '標準（1時間）', transportPriority: [] });
    setDetailedSchedule(null);
    setFontSize('medium');
  };

  // アクティビティタイプに応じたアイコンとカラーを返す関数
  const getActivityStyle = (type) => {
    const styles = {
      departure: { 
        icon: '🚀', 
        iconBg: 'bg-white', 
        iconBorder: 'border-sky-400', 
        iconText: 'text-sky-600',
        cardBg: 'bg-white',
        cardBorder: 'border-gray-200',
        cardShadow: 'shadow-sm hover:shadow-md'
      },
      travel: { 
        icon: '🚗', 
        iconBg: 'bg-white', 
        iconBorder: 'border-sky-400', 
        iconText: 'text-sky-600',
        cardBg: 'bg-white',
        cardBorder: 'border-gray-200',
        cardShadow: 'shadow-sm hover:shadow-md'
      },
      activity: { 
        icon: '🎯', 
        iconBg: 'bg-white', 
        iconBorder: 'border-sky-400', 
        iconText: 'text-sky-600',
        cardBg: 'bg-white',
        cardBorder: 'border-gray-200',
        cardShadow: 'shadow-sm hover:shadow-md'
      },
      meal: { 
        icon: '🍽️', 
        iconBg: 'bg-white', 
        iconBorder: 'border-sky-400', 
        iconText: 'text-sky-600',
        cardBg: 'bg-white',
        cardBorder: 'border-gray-200',
        cardShadow: 'shadow-sm hover:shadow-md'
      },
      accommodation: { 
        icon: '🏨', 
        iconBg: 'bg-white', 
        iconBorder: 'border-sky-400', 
        iconText: 'text-sky-600',
        cardBg: 'bg-white',
        cardBorder: 'border-gray-200',
        cardShadow: 'shadow-sm hover:shadow-md'
      },
      default: { 
        icon: '📍', 
        iconBg: 'bg-white', 
        iconBorder: 'border-gray-300', 
        iconText: 'text-gray-600',
        cardBg: 'bg-white',
        cardBorder: 'border-gray-200',
        cardShadow: 'shadow-sm hover:shadow-md'
      }
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
            onClick={() => setStep('group-setup')}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-indigo-700 transition shadow-lg"
          >
            はじめる
          </button>
        </div>
      </div>
    );
  }

if (step === 'group-setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <Users className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">旅行メンバーの構成</h2>
            <p className="text-gray-600">どなたと旅行されますか？</p>
          </div>

          <div className="space-y-4 mb-8">
            {/* 夫婦・カップル */}
            <div className="p-6 border-2 rounded-xl border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <Heart className="w-8 h-8 text-pink-500" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800">夫婦・カップル</h3>
                  <p className="text-sm text-gray-600">2人での旅行</p>
                </div>
              </div>
              
              <div className="space-y-4 ml-12">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">お一人目の年齢層</label>
                    <select 
                      id="couple-age1"
                      className="w-full p-3 border-2 border-gray-300 rounded-lg"
                      defaultValue="40-50代"
                    >
                      <option value="20-30代">20-30代</option>
                      <option value="40-50代">40-50代</option>
                      <option value="60代以上">60代以上</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">お二人目の年齢層</label>
                    <select 
                      id="couple-age2"
                      className="w-full p-3 border-2 border-gray-300 rounded-lg"
                      defaultValue="40-50代"
                    >
                      <option value="20-30代">20-30代</option>
                      <option value="40-50代">40-50代</option>
                      <option value="60代以上">60代以上</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const age1 = document.getElementById('couple-age1').value;
                    const age2 = document.getElementById('couple-age2').value;
                    const members = [
                      { name: 'お一人目', ageGroup: age1 },
                      { name: 'お二人目', ageGroup: age2 }
                    ];
                    setTravelGroup({ type: 'couple', memberCount: 2, members, hasChildren: false, hasTeens: false, hasSeniors: false });
                    setMemberAnswers([{}, {}]);
                    setStep('questions');
                  }}
                  className="w-full bg-pink-500 text-white py-3 rounded-lg font-semibold hover:bg-pink-600 transition"
                >
                  この構成で進む
                </button>
              </div>
            </div>

            {/* 家族 */}
            <div className="p-6 border-2 rounded-xl border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <Users className="w-8 h-8 text-green-500" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800">家族</h3>
                  <p className="text-sm text-gray-600">家族での旅行</p>
                </div>
              </div>
              
              <div className="space-y-4 ml-12">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">大人の人数</label>
                  <select 
                    id="family-adults"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                    defaultValue="2"
                  >
                    <option value="1">1人</option>
                    <option value="2">2人</option>
                    <option value="3">3人</option>
                    <option value="4">4人</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">構成（該当するものにチェック）</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" id="family-children" className="w-4 h-4" />
                      <Baby className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">小学生以下の子供</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" id="family-teens" className="w-4 h-4" />
                      <User className="w-4 h-4 text-green-500" />
                      <span className="text-sm">中高生</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" id="family-seniors" className="w-4 h-4" />
                      <Users className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">シニア（60代以上）</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const adultCount = parseInt(document.getElementById('family-adults').value);
                    const hasChildren = document.getElementById('family-children').checked;
                    const hasTeens = document.getElementById('family-teens').checked;
                    const hasSeniors = document.getElementById('family-seniors').checked;
                    
                    const members = [];
                    for (let i = 0; i < adultCount; i++) {
                      members.push({ name: `メンバー${i + 1}`, ageGroup: '40-50代' });
                    }
                    
                    setTravelGroup({ 
                      type: 'family', 
                      memberCount: adultCount, 
                      members, 
                      hasChildren, 
                      hasTeens, 
                      hasSeniors 
                    });
                    setMemberAnswers(new Array(adultCount).fill(null).map(() => ({})));
                    setStep('questions');
                  }}
                  className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition"
                >
                  この構成で進む
                </button>
              </div>
            </div>

            {/* 友人グループ */}
            <div className="p-6 border-2 rounded-xl border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <UserPlus className="w-8 h-8 text-blue-500" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800">友人グループ</h3>
                  <p className="text-sm text-gray-600">友人との旅行</p>
                </div>
              </div>
              
              <div className="space-y-4 ml-12">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">人数</label>
                  <select 
                    id="friends-count"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                    defaultValue="2"
                  >
                    <option value="2">2人</option>
                    <option value="3">3人</option>
                    <option value="4">4人</option>
                    <option value="5">5人</option>
                    <option value="6">6人</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">年齢層</label>
                  <select 
                    id="friends-age"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                    defaultValue="20-30代"
                  >
                    <option value="20-30代">20-30代</option>
                    <option value="40-50代">40-50代</option>
                    <option value="60代以上">60代以上</option>
                    <option value="混合">混合</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    const count = parseInt(document.getElementById('friends-count').value);
                    const ageGroup = document.getElementById('friends-age').value;
                    
                    const members = [];
                    for (let i = 0; i < count; i++) {
                      members.push({ name: `メンバー${i + 1}`, ageGroup });
                    }
                    
                    setTravelGroup({ 
                      type: 'friends', 
                      memberCount: count, 
                      members, 
                      hasChildren: false, 
                      hasTeens: false, 
                      hasSeniors: false 
                    });
                    setMemberAnswers(new Array(count).fill(null).map(() => ({})));
                    setStep('questions');
                  }}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
                >
                  この構成で進む
                </button>
              </div>
            </div>

            {/* 一人旅 */}
            <div className="p-6 border-2 rounded-xl border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <User className="w-8 h-8 text-purple-500" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800">一人旅</h3>
                  <p className="text-sm text-gray-600">ソロトラベル</p>
                </div>
              </div>
              
              <div className="space-y-4 ml-12">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">年齢層</label>
                  <select 
                    id="solo-age"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                    defaultValue="40-50代"
                  >
                    <option value="20-30代">20-30代</option>
                    <option value="40-50代">40-50代</option>
                    <option value="60代以上">60代以上</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    const ageGroup = document.getElementById('solo-age').value;
                    const members = [{ name: 'あなた', ageGroup }];
                    
                    setTravelGroup({ 
                      type: 'solo', 
                      memberCount: 1, 
                      members, 
                      hasChildren: false, 
                      hasTeens: false, 
                      hasSeniors: false 
                    });
                    setMemberAnswers([{}]);
                    setStep('questions');
                  }}
                  className="w-full bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 transition"
                >
                  この構成で進む
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep('intro')}
            className="w-full bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition"
          >
            戻る
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
    const currentMember = travelGroup.members[currentMemberIndex];
    const currentAnswers = memberAnswers[currentMemberIndex] || {};
    const allAnswered = questions.every(q => currentAnswers[q.id] !== undefined);
    const isLastMember = currentMemberIndex === travelGroup.members.length - 1;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 sticky top-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {currentMember.name}の好みを教えてください
                </h2>
                <p className="text-gray-600 mt-1">
                  {currentMember.ageGroup} | メンバー {currentMemberIndex + 1}/{travelGroup.members.length}
                </p>
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
                          const newAnswers = [...memberAnswers];
                          newAnswers[currentMemberIndex] = { ...currentAnswers, [q.id]: score };
                          setMemberAnswers(newAnswers);
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
                  if (!isLastMember) {
                    setCurrentMemberIndex(currentMemberIndex + 1);
                    setCurrentQ(0);
                    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                  } else {
                    setStep('member-complete');
                  }
                }}
                className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-4 rounded-xl font-semibold text-lg shadow-2xl hover:from-green-600 hover:to-teal-700 transition"
              >
                {!isLastMember ? `次へ：${travelGroup.members[currentMemberIndex + 1].name}の回答` : '回答完了'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'member-complete') {
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
                    recommendDestinations();
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
              onClick={() => generatePlans()}
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

 if (step === 'detailed-schedule') {
    const fs = getFontSizeClasses();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-5xl mx-auto">
          {/* ヘッダー */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className={`${fs.heading} font-bold text-gray-800`}>
                  {detailedSchedule.destination}旅行スケジュール
                </h1>
                <p className={`${fs.text} text-gray-600 mt-2`}>
                  テーマ: {detailedSchedule.theme}
                </p>
              </div>
              
              {/* 文字サイズ選択 */}
              <div className="flex items-center gap-2">
                <span className={`${fs.label} text-gray-600`}>文字サイズ:</span>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setFontSize('small')}
                    className={`px-3 py-1 rounded ${fontSize === 'small' ? 'bg-white shadow-sm font-semibold' : 'text-gray-600'} transition`}
                  >
                    小
                  </button>
                  <button
                    onClick={() => setFontSize('medium')}
                    className={`px-3 py-1 rounded ${fontSize === 'medium' ? 'bg-white shadow-sm font-semibold' : 'text-gray-600'} transition`}
                  >
                    中
                  </button>
                  <button
                    onClick={() => setFontSize('large')}
                    className={`px-3 py-1 rounded ${fontSize === 'large' ? 'bg-white shadow-sm font-semibold' : 'text-gray-600'} transition`}
                  >
                    大
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* タイムライン形式のスケジュール */}
          {detailedSchedule.days.map((day, dayIdx) => (
            <div key={dayIdx} className="mb-8">
              {/* 日付ヘッダー */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h2 className={`${fs.heading} font-bold text-gray-800`}>
                  {day.day}日目
                </h2>
                <p className={`${fs.label} text-gray-500 mt-1`}>{day.date}</p>
              </div>

              {/* タイムライン */}
              <div className="relative">
                {/* 垂直の点線（水色） */}
                <div className="absolute left-12 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-sky-300"></div>

                {/* アクティビティカード */}
                <div className="space-y-6">
                  {day.activities.map((activity, actIdx) => {
                    const style = getActivityStyle(activity.type);
                    
                    return (
                      <div key={actIdx} className="relative pl-24">
                        {/* 時刻表示（左側） */}
                        <div className="absolute left-0 top-0 w-20 text-right">
                          <div className={`${fs.subheading} font-bold text-sky-600`}>
                            {activity.time}
                          </div>
                        </div>

                        {/* アイコン（点線上） */}
                        <div className={`absolute left-8 top-2 w-8 h-8 rounded-full ${style.iconBg} border-2 ${style.iconBorder} flex items-center justify-center shadow-sm z-10`}>
                          <span className="text-lg">{style.icon}</span>
                        </div>

                        {/* カード */}
                        <div className={`${style.cardBg} ${style.cardShadow} rounded-xl border ${style.cardBorder} p-6 transition-all hover:-translate-y-1`}>
                          {/* カード上部 */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className={`${fs.subheading} font-bold text-gray-800 mb-1`}>
                                {activity.title}
                              </h3>
                              <p className={`${fs.text} text-gray-600`}>
                                {activity.description}
                              </p>
                            </div>
                            {activity.duration && (
                              <div className={`ml-4 px-3 py-1 bg-sky-50 rounded-full ${fs.label} text-sky-700 font-medium whitespace-nowrap`}>
                                {activity.duration}
                              </div>
                            )}
                          </div>

                          {/* 交通手段 */}
                          {activity.transportation && (
                            <div className={`mt-2 ${fs.label} text-gray-500`}>
                              🚆 {activity.transportation}
                            </div>
                          )}

                          {/* レストラン・ホテル候補 */}
                          {activity.placeOptions && activity.placeOptions.length > 0 && (
                            <div className="mt-4 space-y-3 pt-4 border-t border-gray-100">
                              <h4 className={`${fs.subheading} font-semibold text-gray-700 flex items-center gap-2`}>
                                <Star className="w-4 h-4 text-yellow-500" />
                                おすすめ候補
                              </h4>
                              {activity.placeOptions.map((place, idx) => (
                                <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-sky-300 transition">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <h5 className={`${fs.text} font-semibold text-gray-800`}>{place.name}</h5>
                                      <p className={`${fs.label} text-gray-600 mt-1`}>{place.address}</p>
                                      <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1">
                                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                          <span className={`${fs.label} font-semibold`}>{place.rating}</span>
                                        </div>
                                        <span className={`${fs.label} text-gray-500`}>
                                          ({place.userRatingsTotal}件のレビュー)
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-2 mt-3">
                                    <a
                                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.placeId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex-1 bg-sky-500 text-white py-2 px-4 rounded-lg ${fs.button} font-semibold hover:bg-sky-600 transition flex items-center justify-center gap-2`}
                                    >
                                      <MapPin className="w-4 h-4" />
                                      Google Mapsで開く
                                    </a>
                                    <a
                                      href={`https://www.google.com/search?q=${encodeURIComponent(place.name + ' ' + detailedSchedule.destination)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg ${fs.button} font-semibold hover:bg-gray-600 transition flex items-center justify-center gap-2`}
                                    >
                                      <Navigation className="w-4 h-4" />
                                      Google検索
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* フッターボタン */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
            <div className="flex gap-4">
              <button
                onClick={() => setStep('detail-input')}
                className={`flex-1 bg-gray-500 text-white py-3 rounded-xl ${fs.button} font-semibold hover:bg-gray-600 transition`}
              >
                スケジュールを再作成
              </button>
              <button
                onClick={resetApp}
                className={`flex-1 bg-sky-500 text-white py-3 rounded-xl ${fs.button} font-semibold hover:bg-sky-600 transition`}
              >
                最初から作成
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TravelPlannerApp;
