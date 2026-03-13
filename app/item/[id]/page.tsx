'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Item {
  id: string;
  sourceType: string;
  titleRaw: string;
  titleCn: string;
  descriptionRaw: string;
  descriptionCn: string;
  url: string;
  author: string;
  publishedAt: string;
  heatScore: number;
  status: string;
  views: number;
  likes: number;
  comments: number;
  tags: string[];
  // 结构化字段
  oneLiner: string;
  difficulty: string;
  cost: string;
  agentUsage: number;
  businessPotential: number;
  timeToBuild: string;
  tools: string[];
  steps: string[];
  resources: string[];
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

export default function ItemPage() {
  const params = useParams();
  const [item, setItem] = useState<Item | null>(null);
  const [related, setRelated] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/items/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          setItem(data.item);
          setRelated(data.related || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <div className="text-gray-500">内容未找到</div>
          <Link href="/" className="text-primary-600 hover:underline mt-2 block">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-dark-300 dark:to-dark-200">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-dark-100/80 border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link href="/" className="text-primary-600 hover:underline">
            ← 返回
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 主内容区 */}
          <div className="lg:col-span-2 space-y-6">
            <article className="bg-white dark:bg-dark-100 rounded-xl shadow-xl p-8">
              {/* Source & Meta */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{sourceIcons[item.sourceType] || '📄'}</span>
                <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded uppercase">
                  {item.sourceType}
                </span>
                <span className="text-xs text-gray-500">
                  {format(new Date(item.publishedAt), 'MMMM d, yyyy')}
                </span>
                {item.heatScore > 8 && (
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                    🔥 热门
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold mb-2">
                {item.titleCn || item.titleRaw}
              </h1>
              {item.titleRaw !== item.titleCn && item.titleRaw && (
                <p className="text-sm text-gray-500 mb-4 italic">
                  {item.titleRaw}
                </p>
              )}

              {/* One-liner */}
              {item.oneLiner && (
                <div className="bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 px-4 py-3 mb-6">
                  <p className="text-primary-800 dark:text-primary-200 font-medium">
                    💡 {item.oneLiner}
                  </p>
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
                {item.cluster && (
                  <span className="text-xs px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full font-medium">
                    📁 {item.cluster}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="prose dark:prose-invert max-w-none mb-6">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {item.descriptionCn || item.descriptionRaw}
                </p>
              </div>

              {/* 实现步骤 */}
              {item.steps && item.steps.length > 0 && (
                <section className="mb-6">
                  <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <span>📋</span> 实现步骤
                  </h2>
                  <ol className="space-y-3">
                    {item.steps.map((step, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 pt-0.5">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {/* 所需工具 */}
              {item.tools && item.tools.length > 0 && (
                <section className="mb-6">
                  <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <span>🛠️</span> 所需工具
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {item.tools.map((tool, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* 资源链接 */}
              {item.resources && item.resources.length > 0 && (
                <section className="mb-6">
                  <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <span>🔗</span> 相关资源
                  </h2>
                  <ul className="space-y-2">
                    {item.resources.map((resource, index) => (
                      <li key={index}>
                        <a
                          href={resource}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 hover:underline text-sm flex items-center gap-1"
                        >
                          🔗 {resource}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-gray-500 border-t pt-6 mt-6">
                <span>👁 {item.views.toLocaleString()} 阅读</span>
                <span>👍 {item.likes.toLocaleString()} 点赞</span>
                <span>💬 {item.comments.toLocaleString()} 评论</span>
                <span>📊 热度 {item.heatScore.toFixed(1)}</span>
              </div>

              {/* Link */}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                查看原始内容 →
              </a>
            </article>

            {/* 相关玩法 */}
            {related.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span>🔗</span> 相关玩法
                </h2>
                <div className="space-y-3">
                  {related.map((r) => (
                    <Link
                      key={r.id}
                      href={`/item/${r.id}`}
                      className="block bg-white dark:bg-dark-100 rounded-xl p-4 shadow hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{sourceIcons[r.sourceType] || '📄'}</span>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800 dark:text-gray-200">
                            {r.titleCn || r.titleRaw}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span>{r.sourceType}</span>
                            <span>• 🔥 {r.heatScore.toFixed(1)}</span>
                            {r.oneLiner && (
                              <span className="text-gray-400 truncate">• {r.oneLiner}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* 侧边栏 - 结构化信息 */}
          <aside className="space-y-6">
            {/* 快速概览 */}
            <div className="bg-white dark:bg-dark-100 rounded-xl shadow-lg p-6">
              <h3 className="font-bold mb-4">📊 快速概览</h3>
              
              <div className="space-y-4">
                {/* 难度 */}
                {item.difficulty && (
                  <div>
                    <span className="text-sm text-gray-500">难度</span>
                    <div className={`mt-1 inline-block px-3 py-1 rounded-lg text-sm font-medium ${difficultyConfig[item.difficulty]?.color}`}>
                      {difficultyConfig[item.difficulty]?.label || item.difficulty}
                    </div>
                  </div>
                )}

                {/* 成本 */}
                {item.cost && (
                  <div>
                    <span className="text-sm text-gray-500">成本</span>
                    <div className={`mt-1 inline-block px-3 py-1 rounded-lg text-sm font-medium ${costConfig[item.cost]?.color}`}>
                      {costConfig[item.cost]?.label || item.cost}
                    </div>
                  </div>
                )}

                {/* 构建时间 */}
                {item.timeToBuild && (
                  <div>
                    <span className="text-sm text-gray-500">预计耗时</span>
                    <p className="text-gray-800 dark:text-gray-200 font-medium">
                      ⏱️ {item.timeToBuild === '1h' && '1 小时内'}
                      {item.timeToBuild === '1d' && '1 天内'}
                      {item.timeToBuild === '1w' && '1 周内'}
                      {item.timeToBuild === '1m' && '1 月内'}
                    </p>
                  </div>
                )}

                {/* Agent 数量 */}
                <div>
                  <span className="text-sm text-gray-500">Agent 数量</span>
                  <p className="text-gray-800 dark:text-gray-200 font-medium">
                    🤖 {item.agentUsage} 个
                  </p>
                </div>

                {/* 商业潜力 */}
                <div>
                  <span className="text-sm text-gray-500">商业潜力</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                        style={{ width: `${(item.businessPotential / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.businessPotential}/10
                    </span>
                  </div>
                </div>

                {/* 综合评分 */}
                <div>
                  <span className="text-sm text-gray-500">综合评分</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                        style={{ width: `${(item.score / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.score.toFixed(1)}/10
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 所属专题 */}
            {item.cluster && (
              <div className="bg-white dark:bg-dark-100 rounded-xl shadow-lg p-6">
                <h3 className="font-bold mb-4">📁 所属专题</h3>
                <Link
                  href={`/?cluster=${item.cluster}`}
                  className="block px-4 py-3 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors font-medium"
                >
                  {item.cluster} →
                </Link>
              </div>
            )}

            {/* 分享 */}
            <div className="bg-white dark:bg-dark-100 rounded-xl shadow-lg p-6">
              <h3 className="font-bold mb-4">📤 分享</h3>
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 text-sm">
                  复制链接
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
