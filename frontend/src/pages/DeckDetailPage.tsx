import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, ArrowLeft, X, Code2, Type, Image,
  Trash2, Clock, CheckCircle2,
  Video, Link, FileText, Upload,
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cardAPI, uploadAPI } from '../api/services';
import type { Card, CardCreate, ContentBlock } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 所有支持的内容类型
type ContentType = 'text' | 'code' | 'image' | 'video' | 'link' | 'pdf';

const CONTENT_TYPES = [
  { type: 'text' as const, icon: Type, label: '文本' },
  { type: 'code' as const, icon: Code2, label: '代码' },
  { type: 'image' as const, icon: Image, label: '图片' },
  { type: 'video' as const, icon: Video, label: '视频' },
  { type: 'link' as const, icon: Link, label: '链接' },
  { type: 'pdf' as const, icon: FileText, label: 'PDF' },
];

export default function DeckDetailPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // 新卡片表单
  const [contentType, setContentType] = useState<ContentType>('text');
  const [frontValue, setFrontValue] = useState('');
  const [backValue, setBackValue] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('python');
  const [tags, setTags] = useState('');

  // 新增：视频/链接/PDF 的额外字段
  const [linkTitle, setLinkTitle] = useState('');
  const [videoPlatform, setVideoPlatform] = useState('bilibili');
  const [videoTimestamp, setVideoTimestamp] = useState('');
  const [pdfPage, setPdfPage] = useState('');

  // 新增：文件上传状态
  const [uploading, setUploading] = useState(false);

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

  // 文件上传处理
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadAPI.uploadFile(file);
      setFrontValue(res.data.url);
      toast.success(`上传成功: ${res.data.filename}`);
    } catch (err) {
      toast.error('上传失败，请重试');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontValue.trim() || !backValue.trim()) return;

    // 根据类型构建 front_content
    let front: any;

    switch (contentType) {
      case 'code':
        front = { type: 'code', value: frontValue, language: codeLanguage };
        break;
      case 'image':
        front = { type: 'image', value: '', url: frontValue, caption: linkTitle };
        break;
      case 'video':
        front = {
          type: 'video',
          url: frontValue,
          title: linkTitle || '视频',
          platform: videoPlatform,
          timestamp: videoTimestamp ? parseInt(videoTimestamp) : undefined,
        };
        break;
      case 'link':
        front = {
          type: 'link',
          url: frontValue,
          title: linkTitle || '链接',
        };
        break;
      case 'pdf':
        front = {
          type: 'pdf',
          url: frontValue,
          title: linkTitle || 'PDF文档',
          page: pdfPage ? parseInt(pdfPage) : undefined,
        };
        break;
      case 'text':
      default:
        front = { type: 'text', value: frontValue };
        break;
    }

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
      toast.success('卡片创建成功！');
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
    setLinkTitle('');
    setVideoPlatform('bilibili');
    setVideoTimestamp('');
    setPdfPage('');
  };

  // 渲染卡片正面预览
  const renderCardPreview = (card: Card) => {
    const content = card.front_content;
    switch (content.type) {
      case 'code':
        return (
          <SyntaxHighlighter
            language={content.language || 'python'}
            style={oneDark}
            customStyle={{ borderRadius: '8px', fontSize: '13px', margin: 0 }}
          >
            {content.value}
          </SyntaxHighlighter>
        );
      case 'video':
        return (
          <p className="font-medium text-gray-800">
            ▶️ {content.title || content.url}
          </p>
        );
      case 'link':
        return (
          <p className="font-medium text-gray-800">
            🔗 {content.title || content.url}
          </p>
        );
      case 'pdf':
        return (
          <p className="font-medium text-gray-800">
            📄 {content.title || content.url}
            {content.page && ` (第${content.page}页)`}
          </p>
        );
      case 'image':
        return (
          <div className="flex items-center gap-2">
            <img src={content.url} alt="" className="w-12 h-12 rounded object-cover" />
            <p className="font-medium text-gray-800">{content.caption || '图片'}</p>
          </div>
        );
      default:
        return <p className="font-medium text-gray-800">{content.value}</p>;
    }
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
          description="添加你想复习的内容：单词、代码、视频、链接..."
          action={{ label: '添加第一张卡片', onClick: () => setShowModal(true) }}
        />
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <div key={card.id} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="mb-2">{renderCardPreview(card)}</div>
                  <p className="text-sm text-gray-500 line-clamp-1">
                    💡 {card.back_content.value}
                  </p>
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

      {/* ==================== 添加卡片弹窗 ==================== */}
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
              {/* 内容类型选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">内容类型</label>
                <div className="grid grid-cols-3 gap-2">
                  {CONTENT_TYPES.map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { setContentType(type); setFrontValue(''); }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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

              {/* ===== 代码语言 ===== */}
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

              {/* ===== 视频平台 ===== */}
              {contentType === 'video' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">平台</label>
                    <select
                      value={videoPlatform}
                      onChange={(e) => setVideoPlatform(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="bilibili">B站</option>
                      <option value="youtube">YouTube</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">开始秒数（可选）</label>
                    <input
                      type="number"
                      value={videoTimestamp}
                      onChange={(e) => setVideoTimestamp(e.target.value)}
                      placeholder="如 120"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* ===== PDF 页码 ===== */}
              {contentType === 'pdf' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">页码（可选）</label>
                  <input
                    type="number"
                    value={pdfPage}
                    onChange={(e) => setPdfPage(e.target.value)}
                    placeholder="如 42"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* ===== 标题（视频/链接/PDF 共用）===== */}
              {['video', 'link', 'pdf', 'image'].includes(contentType) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标题 / 描述</label>
                  <input
                    type="text"
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    placeholder={
                      contentType === 'video' ? '如：Python装饰器详解' :
                      contentType === 'pdf' ? '如：设计模式第3章' :
                      '输入标题...'
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* ===== 正面（问题）===== */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {contentType === 'text' || contentType === 'code'
                    ? '正面（问题）'
                    : 'URL 地址'}
                </label>

                {/* 文件上传按钮（图片和 PDF）*/}
                {(contentType === 'image' || contentType === 'pdf') && (
                  <div className="mb-2">
                    <label className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 transition-colors ${uploading ? 'opacity-50' : ''}`}>
                      <Upload className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {uploading ? '上传中...' : '上传文件'}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept={contentType === 'image' ? 'image/*' : '.pdf'}
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </label>
                    <span className="text-xs text-gray-400 ml-2">或直接粘贴 URL</span>
                  </div>
                )}

                {contentType === 'code' ? (
                  <textarea
                    value={frontValue}
                    onChange={(e) => setFrontValue(e.target.value)}
                    placeholder="输入代码..."
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none font-mono text-sm"
                  />
                ) : contentType === 'text' ? (
                  <textarea
                    value={frontValue}
                    onChange={(e) => setFrontValue(e.target.value)}
                    placeholder="输入问题..."
                    required
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  />
                ) : (
                  <input
                    type="url"
                    value={frontValue}
                    onChange={(e) => setFrontValue(e.target.value)}
                    placeholder={
                      contentType === 'video' ? 'https://www.bilibili.com/video/BVxxx' :
                      contentType === 'link' ? 'https://example.com/article' :
                      contentType === 'pdf' ? 'https://example.com/book.pdf' :
                      '输入图片URL...'
                    }
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                )}
              </div>

              {/* ===== 背面（答案/笔记）===== */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {contentType === 'text' || contentType === 'code'
                    ? '背面（答案）'
                    : '复习笔记 / 要记住的要点'}
                </label>
                <textarea
                  value={backValue}
                  onChange={(e) => setBackValue(e.target.value)}
                  placeholder={
                    contentType === 'video' ? '这个视频的关键知识点是...' :
                    contentType === 'pdf' ? '这一页的核心内容是...' :
                    '输入答案...'
                  }
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
                  disabled={uploading}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50"
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