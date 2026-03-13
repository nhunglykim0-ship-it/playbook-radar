'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

interface Item {
  id: string;
  sourceType: string;
  titleRaw: string;
  titleCn: string;
  url: string;
  author: string;
  publishedAt: string;
  heatScore: number;
  views: number;
  likes: number;
  comments: number;
  tags: string[];
  oneLiner: string;
  difficulty: string;
  cost: string;
  agentUsage: number;
  businessPotential: number;
  timeToBuild: string;
  score: number;
  cluster: string;
}

const sourceIcons: Record<string, string> = {
  youtube: '📺',
  x: '🐦',
  blog: '📝',
  github: '💻',
  xiaohongshu: '📕',
};

const difficultyConfig: Record<string, { label: string; color: string }> = {
  EASY: { label: '简单', color: 'bg-emerald-100 text-emerald-700' },
  MEDIUM: { label: '中等', color: 'bg-amber-100 text-amber-700' },
  HARD: { label: '困难', color: 'bg-red-100 text-red-700' },
};

const costConfig: Record<string, { label: string; color: string }> = {
  FREE: { label: '免费', color: 'bg-emerald-100 text-emerald-700' },
  LOW: { label: '低成本', color: 'bg-blue-100 text-blue-700' },
  MEDIUM: { label: '中等', color: 'bg-amber-100 text-amber-700' },
  HIGH: { label: '高成本', color: 'bg-red-100 text-red-700' },
};

export default function TopicPage() {
  const params = useParams();
  const router = useRouter();
  const tag = decodeURIComponent(params.tag as string);
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    tag: string;
    items: Item[];
    related: { name: string; count: number }[];
    stats: any;
  } | null>(null);
  
  // 筛选状态
  const [sortBy, setSortBy] = useState('heatScore');
  const [difficulty, setDifficulty] = useState('all');
  const [cost, setCost] = useState('all');

  useEffect(() => {
    const fetchTopic = async () => {
      const params = new URLSearchParams({
        sortBy,
        ...(difficulty !== 'all' && { difficulty }),
        ...(cost !== 'all' && { cost }),
      });
      
      try {
        const res = await fetch(`/api/topics/${encodeURIComponent(tag)}?${params.toString()}`);
        const data = await res.json();
        setData(data);
      } catch (error) {
        console.error('Failed to fetch topic:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopic();
  }, [tag, sortBy, difficulty, cost]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <div className="text-gray-500">专题未找到</div>
          <Link href="/topics" className="text-primary-600 hover:underline mt-2 block">
            返回专题列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-dark-300 dark:to-dark-200">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-dark-100/80 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link href="/topics" className="text-primary-600 hover:underline">
                ← 专题
              </Link>
              <div>
                <h1 className="text-xl font-bold">#{tag}</h1>
                <p className="text-xs text-gray-500">
                  {data.stats.total} 个玩法 · 平均评分 {data.stats.avgScore.toFixed(1)}
                </p>
              </div>
            </div>
            <nav className="flex gap-4 text-sm">
              <Link href="/featured" className="hover:text-primary-600">
                精选
              </Link>
              <Link href="/" className="hover:text-primary-600">
                首页
              </Link>
            </nav>
          </div>

          {/* 筛选栏 */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* 排序 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">排序:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-dark-100 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-primary-400"
              >
                <option value="heatScore">🔥 热度</option>
                <option value="publishedAt">🕐 最新</option>
                <option value="score">⭐ 评分</option>
              </select>
            </div>

            {/* 难度筛选 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">难度:</span>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-dark-100 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-primary-400"
              >
                <option value="all">全部</option>
                <option value="EASY">简单</option>
                <option value="MEDIUM">中等</option>
                <option value="HARD">困难</option>
              </select>
            </div>

            {/* 成本筛选 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">成本:</span>
              <select
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-dark-100 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-primary-400"
              >
                <option value="all">全部</option>
                <option value="FREE">免费</option>
                <option value="LOW">低成本</option>
                <option value="MEDIUM">中等</option>
                <option value="HIGH">高成本</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* 玩法列表 */}
          <div className="lg:col-span-3">
            {data.items.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                暂无内容
                {(difficulty !== 'all' || cost !== 'all') && (
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setDifficulty('all');
                        setCost('all');
                      }}
                      className="text-primary-600 hover:underline"
                    >
                      清除筛选
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {data.items.map((item) => (
                  <article
                    key={item.id}
                    className="bg-white dark:bg-dark-100 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{sourceIcons[item.sourceType] || '📄'}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">
                            {item.sourceType}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(item.publishedAt), 'MMM d, yyyy')}
                          </span>
                          {item.heatScore > 8 && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                              🔥
                            </span>
                          )}
                        </div>
                        <h2 className="text-lg font-semibold mb-2">
                          <Link
                            href={`/item/${item.id}`}
                            className="hover:text-primary-600"
                          >
                            {item.titleCn || item.titleRaw}
                          </Link>
                        </h2>
                        {item.oneLiner && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            💡 {item.oneLiner}
                          </p>
                        )}
                        {item.author && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            by {item.author}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.tags.slice(0, 5).map((tag) => (
                            <Link
                              key={tag}
                              href={`/topics/${encodeURIComponent(tag)}`}
                              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                              #{tag}
                            </Link>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>👁 {item.views.toLocaleString()}</span>
                          <span>🔥 {item.heatScore.toFixed(1)}</span>
                          <span>⭐ {item.score.toFixed(1)}</span>
                          <span>💰 {item.businessPotential}/10</span>
                          <span>🤖 {item.agentUsage}</span>
                          {item.difficulty && (
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${difficultyConfig[item.difficulty]?.color}`}
                            >
                              {difficultyConfig[item.difficulty]?.label}
                            </span>
                          )}
                          {item.cost && (
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${costConfig[item.cost]?.color}`}
                            >
                              {costConfig[item.cost]?.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* 侧边栏 */}
          <aside className="space-y-6">
            {/* 专题统计 */}
            <div className="bg-white dark:bg-dark-100 rounded-xl shadow-lg p-6">
              <h3 className="font-bold mb-4">📊 专题统计</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">玩法数量</span>
                  <span className="font-medium">{data.stats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">平均评分</span>
                  <span className="font-medium">{data.stats.avgScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">平均热度</span>
                  <span className="font-medium">{data.stats.avgHeat.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* 相关专题 */}
            {data.related.length > 0 && (
              <div className="bg-white dark:bg-dark-100 rounded-xl shadow-lg p-6">
                <h3 className="font-bold mb-4">🔗 相关专题</h3>
                <div className="flex flex-wrap gap-2">
                  {data.related.map((r) => (
                    <Link
                      key={r.name}
                      href={`/topics/${encodeURIComponent(r.name)}`}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-1"
                    >
                      <span>#{r.name}</span>
                      <span className="text-xs text-gray-500">({r.count})</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
