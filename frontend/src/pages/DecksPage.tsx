import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, BookOpen, Trash2, X, Play,
  MoreVertical, ChevronRight,
} from 'lucide-react';
import { deckAPI } from '../api/services';
import type { Deck, DeckCreate } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import toast from 'react-hot-toast';

const COLORS = ['#4A90D9', '#7B68EE', '#4CAF50', '#FF6B6B', '#FFA726', '#26C6DA', '#AB47BC', '#5C6BC0'];

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newDeck, setNewDeck] = useState<DeckCreate>({ name: '', description: '', color: '#4A90D9' });
  const navigate = useNavigate();

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      const res = await deckAPI.list();
      setDecks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeck.name.trim()) return;

    try {
      await deckAPI.create(newDeck);
      toast.success('卡片组创建成功！');
      setShowModal(false);
      setNewDeck({ name: '', description: '', color: '#4A90D9' });
      loadDecks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`确定要删除「${name}」吗？所有卡片也会被删除。`)) return;

    try {
      await deckAPI.delete(id);
      toast.success('已删除');
      loadDecks();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* 页头 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">卡片组</h1>
          <p className="text-gray-500 text-sm mt-1">管理你的复习内容</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建卡片组
        </button>
      </div>

      {/* 卡片组列表 */}
      {decks.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="还没有卡片组"
          description="创建你的第一个卡片组，开始添加复习内容吧"
          action={{ label: '新建卡片组', onClick: () => setShowModal(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              {/* 顶部颜色条 */}
              <div
                className="h-2 rounded-t-2xl"
                style={{ backgroundColor: deck.color }}
              />

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div onClick={() => navigate(`/decks/${deck.id}`)}>
                    <h3 className="font-semibold text-lg">{deck.name}</h3>
                    {deck.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {deck.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(deck.id, deck.name);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* 统计 */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span>{deck.card_count} 张卡片</span>
                  {deck.due_count > 0 && (
                    <span className="text-orange-500 font-medium">
                      {deck.due_count} 待复习
                    </span>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/decks/${deck.id}`)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    管理卡片
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  {deck.due_count > 0 && (
                    <button
                      onClick={() => navigate(`/review?deck=${deck.id}`)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      复习
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新建卡片组弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">新建卡片组</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input
                  type="text"
                  value={newDeck.name}
                  onChange={(e) => setNewDeck({ ...newDeck, name: e.target.value })}
                  placeholder="例如：Python基础、英语单词..."
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述（可选）</label>
                <textarea
                  value={newDeck.description}
                  onChange={(e) => setNewDeck({ ...newDeck, description: e.target.value })}
                  placeholder="简单描述这个卡片组的内容..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">颜色</label>
                <div className="flex gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewDeck({ ...newDeck, color })}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        newDeck.color === color ? 'scale-125 ring-2 ring-offset-2 ring-blue-500' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}