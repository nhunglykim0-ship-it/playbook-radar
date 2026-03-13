'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface Item {
  id: string;
  sourceType: string;
  titleRaw: string;
  titleCn?: string;
  url: string;
  status: string;
  heatScore: number;
}

export default function AdminPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    const res = await fetch('/api/admin/items');
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }

  async function handleFetch() {
    setFetching(true);
    await fetch('/api/fetch', { method: 'POST' });
    await loadItems();
    setFetching(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadItems();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-200">
      <header className="bg-white dark:bg-dark-100 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">后台管理</h1>
            <button
              onClick={handleFetch}
              disabled={fetching}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {fetching ? '获取中...' : '🔄 获取新内容'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">加载中...</div>
        ) : (
          <div className="bg-white dark:bg-dark-100 rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-dark-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">来源</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">标题</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">热度</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-dark-200">
                    <td className="px-4 py-3 text-sm">{item.sourceType}</td>
                    <td className="px-4 py-3 text-sm max-w-md truncate">
                      <a href={item.url} target="_blank" className="hover:text-primary-600">
                        {item.titleCn || item.titleRaw}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm">{item.heatScore.toFixed(1)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        item.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {item.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(item.id, 'PUBLISHED')}
                            className="text-emerald-600 hover:underline"
                          >
                            发布
                          </button>
                          <button
                            onClick={() => updateStatus(item.id, 'REJECTED')}
                            className="text-red-600 hover:underline"
                          >
                            拒绝
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                暂无待审核内容
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
