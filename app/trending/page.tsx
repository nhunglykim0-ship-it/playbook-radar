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
  growthScore: number;
}

interface TagCount {
  name: string;
  count: number;
}

const sourceIcons: Record<string, string> = {
  youtube: '📺',
  x: '🐦',
  blog: '📝',
  github: '💻',
  xiaohongshu: '📕',
};

const timeRangeLabels: Record<string, string> = {
  '24h': '24 小时',
  '7d': '7 天',
  '30d': '30 天',
};

export default function TrendingPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    timeRange: string;
    tag: string | null;
    growth: Item[];
    hot: Item[];
    newTags: TagCount[];
    automation: Item[];
    business: Item[];
    stats: any;
  } | null>(null);

  // 筛选状态
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams({ timeRange });
    if (selectedTag) params.set('tag', selectedTag);

    fetch(`/api/trending?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        // 提取所有标签用于筛选
        const tags = new Set<string>();
        [...data.growth, ...data.hot].forEach((item: Item) => {
          item.tags.forEach((tag: string) => tags.add(tag));
        });
        setAllTags(Array.from(tags));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [timeRange, selectedTag]);

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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-primary-600 hover:underline">
                ← 返回
              </Link>
              <div>
                <h1 className="text-xl font-bold">📈 趋势</h1>
                <p className="text-xs text-gray-500">发现上升最快的玩法</p>
              </div>
            </div>
            <nav className="flex gap-4 text-sm">
              <Link href="/featured" className="hover:text-primary-600">
                精选
              </Link>
              <Link href="/topics" className="hover:text-primary-600">
                专题
              </Link>
            </nav>
          </div>

          {/* 筛选栏 */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* 时间范围 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">时间范围:</span>
              <div className="flex gap-1">
                {(['24h', '7d', '30d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      timeRange === range
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-dark-100 hover:bg-gray-100'
                    }`}
                  >
                    {timeRangeLabels[range]}
                  </button>
                ))}
              </div>
            </div>

            {/* 标签筛选 */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500">标签:</span>
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedTag === null
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
                  }`}
                >
                  全部
                </button>
                {allTags.slice(0, 10).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedTag === tag
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 统计卡片 */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-dark-100 rounded-xl p-4 text-center shadow">
            <div className="text-2xl font-bold text-primary-600">{data.stats.total}</div>
            <div className="text-xs text-gray-500">新增玩法</div>
          </div>
          <div className="bg-white dark:bg-dark-100 rounded-xl p-4 text-center shadow">
            <div className="text-2xl font-bold text-amber-600">{data.stats.avgHeat.toFixed(1)}</div>
            <div className="text-xs text-gray-500">平均热度</div>
          </div>
          <div className="bg-white dark:bg-dark-100 rounded-xl p-4 text-center shadow">
            <div className="text-2xl font-bold text-emerald-600">{data.stats.avgScore.toFixed(1)}</div>
            <div className="text-xs text-gray-500">平均评分</div>
          </div>
          <div className="bg-white dark:bg-dark-100 rounded-xl p-4 text-center shadow">
            <div className="text-2xl font-bold text-purple-600">{data.stats.avgBusiness.toFixed(1)}</div>
            <div className="text-xs text-gray-500">平均商业潜力</div>
          </div>
          <div className="bg-white dark:bg-dark-100 rounded-xl p-4 text-center shadow">
            <div className="text-2xl font-bold text-blue-600">{(data.stats.totalViews / 1000).toFixed(0)}k</div>
            <div className="text-xs text-gray-500">总阅读</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 左侧主区域 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 今日增长最快 */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="text-xl">🚀</span> 增长最快玩法
                </h2>
                <span className="text-xs text-gray-500">基于热度 + 时间衰减</span>
              </div>
              <div className="space-y-3">
                {data.growth.slice(0, 5).map((item, index) => (
                  <TrendingCard
                    key={item.id}
                    item={item}
                    rank={index + 1}
                    metric={{ label: '增长分', value: item.growthScore.toFixed(1) }}
                  />
                ))}
              </div>
            </section>

            {/* 热门玩法 */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="text-xl">🔥</span> 热门玩法
                </h2>
                <span className="text-xs text-gray-500">按热度排序</span>
              </div>
              <div className="space-y-3">
                {data.hot.slice(0, 5).map((item, index) => (
                  <TrendingCard
                    key={item.id}
                    item={item}
                    rank={data.growth.findIndex((i) => i.id === item.id) + 1}
                    metric={{ label: '热度', value: item.heatScore.toFixed(1) }}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* 右侧边栏 */}
          <aside className="space-y-8">
            {/* 新增标签 */}
            <div className="bg-white dark:bg-dark-100 rounded-xl shadow-lg p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span className="text-xl">🏷️</span> 新增标签
              </h3>
              <div className="space-y-2">
                {data.newTags.map((tag, index) => (
                  <div
                    key={tag.name}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-4">{index + 1}</span>
                      <Link
                        href={`/topics/${encodeURIComponent(tag.name)}`}
                        className="text-sm font-medium hover:text-primary-600"
                      >
                        #{tag.name}
                      </Link>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {tag.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 自动化程度最高 */}
            <div className="bg-white dark:bg-dark-100 rounded-xl shadow-lg p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span className="text-xl">🤖</span> 高自动化
              </h3>
              <div className="space-y-3">
                {data.automation.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    href={`/item/${item.id}`}
                    className="block p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{sourceIcons[item.sourceType] || '📄'}</span>
                      <span className="text-sm font-medium line-clamp-1">
                        {item.titleCn || item.titleRaw}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>🤖 {item.agentUsage} agents</span>
                      <span>⭐ {item.score.toFixed(1)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 商业潜力最高 */}
            <div className="bg-white dark:bg-dark-100 rounded-xl shadow-lg p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span className="text-xl">💰</span> 商业潜力
              </h3>
              <div className="space-y-3">
                {data.business.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    href={`/item/${item.id}`}
                    className="block p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{sourceIcons[item.sourceType] || '📄'}</span>
                      <span className="text-sm font-medium line-clamp-1">
                        {item.titleCn || item.titleRaw}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mr-2">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                          style={{ width: `${(item.businessPotential / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-emerald-600">
                        {item.businessPotential}/10
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function TrendingCard({
  item,
  rank,
  metric,
}: {
  item: Item;
  rank: number;
  metric: { label: string; value: string };
}) {
  return (
    <Link
      href={`/item/${item.id}`}
      className="bg-white dark:bg-dark-100 rounded-xl p-4 shadow hover:shadow-md transition-shadow flex items-start gap-4"
    >
      <div
        className={`text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          rank === 1
            ? 'bg-amber-100 text-amber-700'
            : rank === 2
            ? 'bg-gray-200 text-gray-700'
            : rank === 3
            ? 'bg-orange-100 text-orange-700'
            : 'bg-gray-100 text-gray-500'
        }`}
      >
        {rank}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{sourceIcons[item.sourceType] || '📄'}</span>
          <span className="text-xs text-gray-500">
            {format(new Date(item.publishedAt), 'MMM d')}
          </span>
        </div>
        <h3 className="font-medium mb-2 line-clamp-2">
          {item.titleCn || item.titleRaw}
        </h3>
        {item.oneLiner && (
          <p className="text-sm text-gray-500 mb-2 line-clamp-1">
            💡 {item.oneLiner}
          </p>
        )}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">
            {metric.label}: {metric.value}
          </span>
          <span>👁 {item.views.toLocaleString()}</span>
          <span>⭐ {item.score.toFixed(1)}</span>
          <span>💰 {item.businessPotential}/10</span>
        </div>
      </div>
    </Link>
  );
}
