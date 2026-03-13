'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface Item {
  id: string;
  sourceType: string;
  titleCn: string;
  titleRaw: string;
  url: string;
  author: string;
  publishedAt: string;
  heatScore: number;
  tags: string[];
}

const sourceIcons: Record<string, string> = {
  youtube: '📺',
  x: '🐦',
  blog: '📝',
  github: '💻',
  xiaohongshu: '📕',
};

export default function DailyPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [grouped, setGrouped] = useState<Record<string, Item[]>>({});

  useEffect(() => {
    fetch('/api/items?status=PUBLISHED&limit=100&sortBy=publishedAt')
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        // Group by date
        const groups: Record<string, Item[]> = {};
        data.forEach((item: Item) => {
          const date = format(new Date(item.publishedAt), 'yyyy-MM-dd');
          if (!groups[date]) groups[date] = [];
          groups[date].push(item);
        });
        setGrouped(groups);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const dates = Object.keys(grouped).sort().reverse();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-dark-300 dark:to-dark-200">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-dark-100/80 border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" className="text-primary-600 hover:underline">
                ← 返回
              </a>
              <h1 className="text-xl font-bold">日报</h1>
            </div>
            <nav className="flex gap-4 text-sm">
              <a href="/admin" className="hover:text-primary-600">后台</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : dates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">暂无日报内容</div>
        ) : (
          <div className="space-y-8">
            {dates.map((date) => (
              <section key={date} className="bg-white dark:bg-dark-100 rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-bold mb-4 pb-2 border-b">
                  📅 {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </h2>
                <div className="space-y-4">
                  {grouped[date].map((item) => (
                    <article key={item.id} className="flex items-start gap-3">
                      <span className="text-2xl">{sourceIcons[item.sourceType] || '📄'}</span>
                      <div className="flex-1">
                        <h3 className="font-medium">
                          <a
                            href={`/item/${item.id}`}
                            className="hover:text-primary-600"
                          >
                            {item.titleCn || item.titleRaw}
                          </a>
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span>{item.sourceType}</span>
                          {item.author && <span>• {item.author}</span>}
                          <span>• 🔥 {item.heatScore.toFixed(1)}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.slice(0, 5).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
