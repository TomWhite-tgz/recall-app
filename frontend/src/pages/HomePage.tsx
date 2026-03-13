import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, BookOpen, Target, Flame, TrendingUp, Play } from 'lucide-react';
import { statsAPI, reviewAPI } from '../api/services';
import type { StatsOverview } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function HomePage() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, dueRes] = await Promise.all([
        statsAPI.overview(),
        reviewAPI.getDueCards(),
      ]);
      setStats(statsRes.data);
      setDueCount(dueRes.data.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      {/* 欢迎横幅 */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white">
        <h1 className="text-2xl font-bold mb-2">📚 今日复习</h1>
        <p className="text-blue-100 mb-6">
          {dueCount > 0
            ? `你有 ${dueCount} 张卡片需要复习，现在是最佳复习时间！`
            : '🎉 太棒了！今天的复习已全部完成！'}
        </p>
        {dueCount > 0 && (
          <button
            onClick={() => navigate('/review')}
            className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
          >
            <Play className="w-5 h-5" />
            开始复习 ({dueCount})
          </button>
        )}
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="总卡片数"
          value={stats?.total_cards ?? 0}
          color="blue"
        />
        <StatCard
          icon={Target}
          label="待复习"
          value={stats?.due_today ?? 0}
          color="orange"
        />
        <StatCard
          icon={Brain}
          label="今日已复习"
          value={stats?.reviewed_today ?? 0}
          color="green"
        />
        <StatCard
          icon={Flame}
          label="连续学习"
          value={`${stats?.streak_days ?? 0}天`}
          color="red"
        />
      </div>

      {/* 记忆保持率 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          记忆保持率
        </h2>
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="40" fill="none" stroke="#4A90D9" strokeWidth="8"
                strokeDasharray={`${(stats?.avg_retention ?? 0) * 251.2} 251.2`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
              {Math.round((stats?.avg_retention ?? 0) * 100)}%
            </span>
          </div>
          <div>
            <p className="text-gray-600">
              根据艾宾浩斯遗忘曲线，按时复习可以将记忆保持率维持在 90% 以上。
            </p>
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/decks')}
          className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <BookOpen className="w-8 h-8 text-blue-500 mb-3" />
          <h3 className="font-semibold">管理卡片组</h3>
          <p className="text-sm text-gray-500 mt-1">创建、编辑和管理你的复习内容</p>
        </button>
        <button
          onClick={() => navigate('/review')}
          className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <Brain className="w-8 h-8 text-indigo-500 mb-3" />
          <h3 className="font-semibold">开始复习</h3>
          <p className="text-sm text-gray-500 mt-1">立即复习到期的卡片</p>
        </button>
      </div>
    </div>
  );
}

// 统计小卡片组件
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number | string;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-500',
    green: 'bg-green-50 text-green-500',
    orange: 'bg-orange-50 text-orange-500',
    red: 'bg-red-50 text-red-500',
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}