import { useEffect, useState } from 'react';
import {
  Brain, BookOpen, Target, Flame,
  TrendingUp, Calendar,
} from 'lucide-react';
import { statsAPI } from '../api/services';
import type { StatsOverview } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function StatsPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await statsAPI.overview();
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">学习统计</h1>
        <p className="text-gray-500 text-sm mt-1">你的复习数据一览</p>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={BookOpen} label="总卡片" value={stats?.total_cards ?? 0} color="blue" />
        <MetricCard icon={Target} label="待复习" value={stats?.due_today ?? 0} color="orange" />
        <MetricCard icon={Brain} label="今日已复习" value={stats?.reviewed_today ?? 0} color="green" />
        <MetricCard icon={Flame} label="连续学习" value={`${stats?.streak_days ?? 0}天`} color="red" />
      </div>

      {/* 记忆保持率 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          记忆保持率
        </h2>
        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="40" fill="none" stroke="#4CAF50" strokeWidth="10"
                strokeDasharray={`${(stats?.avg_retention ?? 0) * 251.2} 251.2`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{Math.round((stats?.avg_retention ?? 0) * 100)}%</span>
              <span className="text-xs text-gray-500">保持率</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-medium mb-2">艾宾浩斯遗忘曲线</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              按照科学的复习间隔进行复习：
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['5分钟', '30分钟', '12小时', '1天', '2天', '4天', '7天', '15天', '30天'].map((t, i) => (
                <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 复习提示 */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6">
        <h3 className="font-semibold text-indigo-700 mb-2">💡 复习建议</h3>
        <ul className="text-sm text-indigo-600 space-y-1">
          <li>• 每天固定时间复习效果最佳</li>
          <li>• 新内容建议在睡前和早起各复习一次</li>
          <li>• 不确定的卡片选择「困难」而不是「忘了」</li>
          <li>• 坚持30天会形成长期记忆</li>
        </ul>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: number | string; color: string;
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