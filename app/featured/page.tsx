'use client';

import { useEffect, useState } from 'react';
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
  featuredScore: number;
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

export default function FeaturedPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    today: Item[];
    week: Item[];
    soloFounder: Item[];
    highAutomation: Item[];
    stats: any;
  } | null>(null);

  useEffect(() => {
    fetch('/api/featured')
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
        <div className="text-center text-gray-500">加载失败</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-dark-300 dark:to-dark-200">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-dark-100/80 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-primary-600 hover:underline">
                ← 返回
              </Link>
              <div>
                <h1 className="text-xl font-bold">✨ 精选</h1>
                <p className="text-xs text-gray-500">每日精选 · 最值得看的玩法</p>
              </div>
            </div>
            <nav className="flex gap-4 text-sm">
              <Link href="/trending" className="hover:text-primary-600">
                趋势
              </Link>
              <Link href="/topics" className="hover:text-primary-600">
                专题
              </Link>
              <Link href="/admin" className="hover:text-primary-600">
                后台
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 统计 */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-dark-100 rounded-xl p-4 text-center shadow">
            <div className="text-2xl font-bold text-primary-600">{data.stats.total}</div>
            <div className="text-xs text-gray-500">总玩法</div>
          </div>
          <div className="bg-white dark:bg-dark-100 rounded-xl p-4 text-center shadow">
            <div className="text-2xl font-bold text-emerald-600">{data.stats.todayCount}</div>
            <div className="text-xs text-gray-500">今日新增</div>
          </div>
          <div className="bg-white dark:bg-dark-100 rounded-xl p-4 text-center shadow">
            <div className="text-2xl font-bold text-amber-600">{data.stats.weekCount}</div>
            <div className="text-xs text-gray-500">本周新增</div>
          </div>
        </div>

        {/* 今日最值得看 */}
        <section className="mb-12">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-xl">🔥</span> 今日最值得看
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.today.length > 0 ? (
              data.today.map((item) => (
                <FeaturedCard key={item.id} item={item} />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                今日暂无新内容
              </div>
            )}
          </div>
        </section>

        {/* 本周热门 */}
        <section className="mb-12">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-xl">📈</span> 本周热门玩法
          </h2>
          <div className="space-y-3">
            {data.week.map((item, index) => (
              <div
                key={item.id}
                className="bg-white dark:bg-dark-100 rounded-xl p-4 shadow hover:shadow-md transition-shadow flex items-start gap-4"
              >
                <div className="text-2xl font-bold text-gray-300 w-8">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{sourceIcons[item.sourceType] || '📄'}</span>
                    <Link
                      href={`/item/${item.id}`}
                      className="font-medium hover:text-primary-600"
                    >
                      {item.titleCn || item.titleRaw}
                    </Link>
                  </div>
                  {item.oneLiner && (
                    <p className="text-sm text-gray-500 mb-2">{item.oneLiner}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>🔥 {item.heatScore.toFixed(1)}</span>
                    <span>👁 {item.views.toLocaleString()}</span>
                    <span>⭐ {item.score.toFixed(1)}</span>
                    {item.difficulty && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${difficultyConfig[item.difficulty]?.color}`}
                      >
                        {difficultyConfig[item.difficulty]?.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 一人公司玩法 */}
        <section className="mb-12">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-xl">👤</span> 一人公司必备玩法
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.soloFounder.map((item) => (
              <FeaturedCard key={item.id} item={item} compact />
            ))}
          </div>
        </section>

        {/* 高自动化玩法 */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-xl">🤖</span> 高自动化程度玩法
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.highAutomation.map((item) => (
              <FeaturedCard key={item.id} item={item} compact />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function FeaturedCard({ item, compact = false }: { item: Item; compact?: boolean }) {
  if (compact) {
    return (
      <Link
        href={`/item/${item.id}`}
        className="bg-white dark:bg-dark-100 rounded-xl p-4 shadow hover:shadow-lg transition-shadow block"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{sourceIcons[item.sourceType] || '📄'}</span>
          <span className="text-xs text-gray-500">{item.sourceType}</span>
        </div>
        <h3 className="font-medium text-sm mb-2 line-clamp-2">
          {item.titleCn || item.titleRaw}
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>🤖 {item.agentUsage}</span>
          <span>⭐ {item.score.toFixed(1)}</span>
          <span>💰 {item.businessPotential}/10</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/item/${item.id}`}
      className="bg-white dark:bg-dark-100 rounded-xl p-5 shadow-lg hover:shadow-xl transition-shadow block"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-3xl">{sourceIcons[item.sourceType] || '📄'}</span>
        <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded uppercase">
          {item.sourceType}
        </span>
      </div>
      <h3 className="font-bold text-base mb-2 line-clamp-2">
        {item.titleCn || item.titleRaw}
      </h3>
      {item.oneLiner && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          💡 {item.oneLiner}
        </p>
      )}
      <div className="flex flex-wrap gap-2 mb-3">
        {item.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
          >
            #{tag}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span>🔥 {item.heatScore.toFixed(1)}</span>
          <span>⭐ {item.score.toFixed(1)}</span>
        </div>
        <span>💰 {item.businessPotential}/10</span>
      </div>
    </Link>
  );
}
