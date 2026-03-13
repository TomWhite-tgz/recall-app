import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  RotateCcw, Eye, ArrowLeft, Trophy,
  Brain, Clock, Zap, CheckCircle,
} from 'lucide-react';
import { reviewAPI } from '../api/services';
import type { Card, ReviewResult } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

// 评分按钮配置
const RATING_BUTTONS = [
  { quality: 0, label: '忘了', emoji: '😣', color: 'bg-red-500 hover:bg-red-600', preview: '1分钟' },
  { quality: 2, label: '困难', emoji: '😅', color: 'bg-orange-500 hover:bg-orange-600', preview: '5分钟' },
  { quality: 3, label: '记得', emoji: '🙂', color: 'bg-blue-500 hover:bg-blue-600', preview: '正常' },
  { quality: 4, label: '简单', emoji: '😊', color: 'bg-green-500 hover:bg-green-600', preview: '延长' },
  { quality: 5, label: '完美', emoji: '🤩', color: 'bg-emerald-500 hover:bg-emerald-600', preview: '最长' },
];

export default function ReviewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const deckId = searchParams.get('deck') || undefined;

  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [sessionResults, setSessionResults] = useState<ReviewResult[]>([]);

  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    loadDueCards();
  }, []);

  const loadDueCards = async () => {
    try {
      const res = await reviewAPI.getDueCards(deckId);
      if (res.data.length === 0) {
        setCompleted(true);
      } else {
        setCards(res.data);
        startTimeRef.current = Date.now();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = () => {
    setShowAnswer(true);
  };

  const handleRate = async (quality: number) => {
    if (submitting) return;
    setSubmitting(true);

    const card = cards[currentIndex];
    const timeSpent = Date.now() - startTimeRef.current;

    try {
      const res = await reviewAPI.submit({
        card_id: card.id,
        quality,
        time_spent_ms: timeSpent,
      });

      setSessionResults(prev => [...prev, res.data]);
      toast.success(res.data.message, { duration: 1500 });

      // 下一张卡片
      if (currentIndex + 1 < cards.length) {
        setCurrentIndex(prev => prev + 1);
        setShowAnswer(false);
        startTimeRef.current = Date.now();
      } else {
        setCompleted(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (completed) return;

      if (!showAnswer) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          handleReveal();
        }
      } else {
        const keyMap: Record<string, number> = {
          'Digit1': 0, 'Digit2': 2, 'Digit3': 3, 'Digit4': 4, 'Digit5': 5,
        };
        if (keyMap[e.code] !== undefined) {
          e.preventDefault();
          handleRate(keyMap[e.code]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAnswer, currentIndex, completed, submitting]);

  if (loading) return <LoadingSpinner text="加载复习卡片..." />;

  // ===== 完成页面 =====
  if (completed) {
    const correctCount = sessionResults.filter(r => r.repetition_count > 0).length;

    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-yellow-500" />
          </div>
        </motion.div>

        <h1 className="text-3xl font-bold mb-2">🎉 复习完成！</h1>
        <p className="text-gray-500 mb-8">你太棒了，所有到期的卡片都复习完了</p>

        {sessionResults.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-2xl font-bold text-blue-500">{sessionResults.length}</p>
              <p className="text-sm text-gray-500">复习总数</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-2xl font-bold text-green-500">{correctCount}</p>
              <p className="text-sm text-gray-500">记住了</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-2xl font-bold text-orange-500">
                {sessionResults.length - correctCount}
              </p>
              <p className="text-sm text-gray-500">需加强</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
          >
            返回首页
          </button>
          <button
            onClick={() => {
              setCards([]);
              setCurrentIndex(0);
              setShowAnswer(false);
              setCompleted(false);
              setSessionResults([]);
              setLoading(true);
              loadDueCards();
            }}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600"
          >
            继续复习
          </button>
        </div>
      </div>
    );
  }

  // ===== 复习界面 =====
  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm text-gray-500">
          {currentIndex + 1} / {cards.length}
        </span>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>第 {currentCard.repetition_count + 1} 次复习</span>
        </div>
      </div>

      {/* 进度条 */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full mb-8 overflow-hidden">
        <motion.div
          className="h-full bg-blue-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* 卡片 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          {/* 正面（问题） */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-4 min-h-[200px] flex flex-col justify-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">问题</p>
            <CardContent content={currentCard.front_content} />
          </div>

          {/* 背面（答案）*/}
          {showAnswer ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 mb-6 min-h-[150px] flex flex-col justify-center"
            >
              <p className="text-xs text-green-600 uppercase tracking-wide mb-4">答案</p>
              <CardContent content={currentCard.back_content} />
            </motion.div>
          ) : (
            <button
              onClick={handleReveal}
              className="w-full py-4 bg-white border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 mb-6"
            >
              <Eye className="w-5 h-5" />
              点击显示答案（或按空格键）
            </button>
          )}

          {/* 评分按钮 */}
          {showAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-center text-sm text-gray-500 mb-3">你记住了吗？（键盘 1-5）</p>
              <div className="flex gap-2">
                {RATING_BUTTONS.map(({ quality, label, emoji, color, preview }, index) => (
                  <button
                    key={quality}
                    onClick={() => handleRate(quality)}
                    disabled={submitting}
                    className={`flex-1 py-4 ${color} text-white rounded-xl font-medium transition-all 
                      disabled:opacity-50 hover:scale-105 active:scale-95 flex flex-col items-center gap-1`}
                  >
                    <span className="text-xl">{emoji}</span>
                    <span className="text-sm">{label}</span>
                    <span className="text-xs opacity-75">[{index + 1}]</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// 内容渲染组件
function CardContent({ content }: { content: any }) {
  if (!content) return null;

  switch (content.type) {
    case 'code':
      return (
        <SyntaxHighlighter
          language={content.language || 'python'}
          style={oneDark}
          customStyle={{ borderRadius: '12px', fontSize: '14px' }}
        >
          {content.value}
        </SyntaxHighlighter>
      );

    case 'image':
      return (
        <div className="text-center">
          {content.caption && <p className="mb-3 text-gray-600">{content.caption}</p>}
          <img
            src={content.url}
            alt={content.caption || ''}
            className="max-h-64 mx-auto rounded-xl"
          />
        </div>
      );

    case 'text':
    default:
      return <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">{content.value}</p>;
  }
}