'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Tag {
  name: string;
  category: string;
  description: string;
  count: number;
}

const categoryLabels: Record<string, string> = {
  PLAYSTYLE: '玩法风格',
  TUTORIAL: '教程',
  CASE: '案例',
  TOOL: '工具',
  UPDATE: '更新',
  PLATFORM: '平台',
  OTHER: '其他',
};

export default function TopicsPage() {
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<Tag[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Tag[]>>({});

  useEffect(() => {
    fetch('/api/tags')
      .then((res) => res.json())
      .then((data) => {
        setTags(data.tags);
        setGrouped(data.grouped);
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
                <h1 className="text-xl font-bold">📁 专题</h1>
                <p className="text-xs text-gray-500">按主题浏览玩法</p>
              </div>
            </div>
            <nav className="flex gap-4 text-sm">
              <Link href="/featured" className="hover:text-primary-600">
                精选
              </Link>
              <Link href="/admin" className="hover:text-primary-600">
                后台
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 热门标签 */}
        <section className="mb-12">
          <h2 className="text-lg font-bold mb-4">🔥 热门标签</h2>
          <div className="flex flex-wrap gap-3">
            {tags.slice(0, 20).map((tag) => (
              <Link
                key={tag.name}
                href={`/topics/${encodeURIComponent(tag.name)}`}
                className="px-4 py-2 bg-white dark:bg-dark-100 rounded-full shadow hover:shadow-md transition-shadow flex items-center gap-2"
              >
                <span className="text-sm font-medium">#{tag.name}</span>
                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                  {tag.count}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 按分类浏览 */}
        {Object.entries(grouped).map(([category, categoryTags]) => (
          <section key={category} className="mb-12">
            <h2 className="text-lg font-bold mb-4">
              {categoryLabels[category] || category}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categoryTags.map((tag) => (
                <Link
                  key={tag.name}
                  href={`/topics/${encodeURIComponent(tag.name)}`}
                  className="bg-white dark:bg-dark-100 rounded-xl p-4 shadow hover:shadow-lg transition-shadow block"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-1">
                      #{tag.name}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {tag.count} 个玩法
                    </span>
                  </div>
                  {tag.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {tag.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}

        {/* 所有标签 */}
        <section>
          <h2 className="text-lg font-bold mb-4">📋 全部标签</h2>
          <div className="bg-white dark:bg-dark-100 rounded-xl p-6 shadow">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag.name}
                  href={`/topics/${encodeURIComponent(tag.name)}`}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <span>{tag.name}</span>
                  <span className="text-xs text-gray-500">({tag.count})</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
