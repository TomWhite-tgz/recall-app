import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, ArrowLeft, X, Code2, Type, Image,
  Trash2, Clock, CheckCircle2,
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cardAPI, deckAPI } from '../api/services';
import type { Card, CardCreate, Deck, ContentBlock } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function DeckDetailPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // 新卡片表单
  const [contentType, setContentType] = useState<'text' | 'code' | 'image'>('text');
  const [frontValue, setFrontValue] = useState('');
  const [backValue, setBackValue] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('python');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (deckId) loadCards();
  }, [deckId]);

  const loadCards = async () => {
    try {
      const res = await cardAPI.listByDeck(deckId!);
      setCards(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontValue.trim() || !backValue.trim()) return;

    const front: ContentBlock = contentType === 'code'
      ? { type: 'code', value: frontValue, language: codeLanguage }
      : contentType === 'image'
        ? { type: 'image', value: '', url: frontValue, caption: '' }
        : { type: 'text', value: frontValue };

    const back: ContentBlock = { type: 'text', value: backValue };

    const data: CardCreate = {
      deck_id: deckId!,
      content_type: contentType,
      front_content: front,
      back_content: back,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    };

    try {
      await cardAPI.create(data);
      toast.success('卡片创建成功！5分钟后将开始第一次复习');
      setShowModal(false);
      resetForm();
      loadCards();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!window.confirm('确定删除这张卡片吗？')) return;
    try {
      await cardAPI.delete(id);
      toast.success('已删除');
      loadCards();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setFrontValue('');
    setBackValue('');
    setTags('');
    setContentType('text');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* 页头 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/decks')} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">卡片管理</h1>
            <p className="text-gray-500 text-sm">{cards.length} 张卡片</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加卡片
        </button>
      </div>

      {/* 卡片列表 */}
      {cards.length === 0 ? (
        <EmptyState
          icon={Type}
          title="还没有卡片"
          description="添加你想复习的内容：单词、代码、知识点..."
          action={{ label: '添加第一张卡片', onClick: () => setShowModal(true) }}
        />
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <div key={card.id} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* 正面内容 */}
                  <div className="mb-2">
                    {card.content_type === 'code' ? (
                      <SyntaxHighlighter
                        language={card.front_content.language || 'python'}
                        style={oneDark}
                        customStyle={{ borderRadius: '8px', fontSize: '13px', margin: 0 }}
                      >
                        {card.front_content.value}
                      </SyntaxHighlighter>
                    ) : (
                      <p className="font-medium text-gray-800">{card.front_content.value}</p>
                    )}
                  </div>

                  {/* 背面预览 */}
                  <p className="text-sm text-gray-500 line-clamp-1">
                    💡 {card.back_content.value}
                  </p>

                  {/* 状态信息 */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      复习 {card.total_reviews} 次
                    </span>
                    {card.next_review_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(card.next_review_at) <= new Date()
                          ? '需要复习'
                          : `${formatDistanceToNow(new Date(card.next_review_at), { locale: zhCN })}后复习`
                        }
                      </span>
                    )}
                    {card.tags.length > 0 && (
                      <div className="flex gap-1">
                        {card.tags.map((tag, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-3"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 添加卡片弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">添加卡片</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCard} className="space-y-5">
              {/* 内容类型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">内容类型</label>
                <div className="flex gap-2">
                  {[
                    { type: 'text' as const, icon: Type, label: '文本' },
                    { type: 'code' as const, icon: Code2, label: '代码' },
                    { type: 'image' as const, icon: Image, label: '图片' },
                  ].map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setContentType(type)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        contentType === type
                          ? 'bg-blue-50 text-blue-600 border-2 border-blue-200'
                          : 'bg-gray-50 text-gray-600 border-2 border-transparent'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 代码语言选择 */}
              {contentType === 'code' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">编程语言</label>
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['python', 'javascript', 'typescript', 'java', 'go', 'rust', 'c', 'cpp', 'sql', 'bash', 'html', 'css'].map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 正面(问题) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  正面（问题）
                </label>
                {contentType === 'image' ? (
                  <input
                    type="url"
                    value={frontValue}
                    onChange={(e) => setFrontValue(e.target.value)}
                    placeholder="输入图片URL..."
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                ) : (
                  <textarea
                    value={frontValue}
                    onChange={(e) => setFrontValue(e.target.value)}
                    placeholder={contentType === 'code' ? '输入代码...' : '输入问题...'}
                    required
                    rows={contentType === 'code' ? 6 : 3}
                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none ${
                      contentType === 'code' ? 'font-mono text-sm' : ''
                    }`}
                  />
                )}
              </div>

              {/* 背面(答案) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  背面（答案）
                </label>
                <textarea
                  value={backValue}
                  onChange={(e) => setBackValue(e.target.value)}
                  placeholder="输入答案..."
                  required
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* 标签 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标签（逗号分隔）</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="python, 基础, 函数"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* 提交 */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600"
                >
                  保存卡片
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}