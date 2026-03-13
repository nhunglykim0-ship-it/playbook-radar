'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import SearchBar from '@/components/ui/SearchBar';
import FilterPanel from '@/components/ui/FilterPanel';

interface Item {
  id: string;
  sourceType: string;
  titleRaw: string;
  titleCn: string;
  url: string;
  author: string;
  publishedAt: string;
  heatScore: number;
  status: string;
  views: number;
  likes: number;
  comments: number;
  tags: string[];
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // 筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  
  // 高级筛选
  const [heatMin, setHeatMin] = useState<number | null>(null);
  const [heatMax, setHeatMax] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('heatScore');

  // 加载数据
  const loadItems = useCallback(async () => {
    setLoading(true);
    
    const params = new URLSearchParams({
      status: 'PUBLISHED',
      limit: '100',
      sortBy,
    });
    
    if (searchQuery) params.set('q', searchQuery);
    if (sourceFilter !== 'all') params.set('sourceType', sourceFilter);
    if (tagFilter) params.set('tag', tagFilter);
    if (heatMin !== null) params.set('heatMin', heatMin.toString());
    if (heatMax !== null) params.set('heatMax', heatMax.toString());
    if (dateRange !== 'all') params.set('dateRange', dateRange);
    
    try {
      const res = await fetch(`/api/items?${params.toString()}`);
      const data = await res.json();
      setItems(data);
      setTotalCount(data.length);
      
      // 提取所有唯一标签（仅当无筛选时）
      if (!searchQuery && sourceFilter === 'all' && !tagFilter && !heatMin && !heatMax && dateRange === 'all') {
        const tags = new Set<string>();
        data.forEach((item: Item) => {
          item.tags.forEach((tag: string) => tags.add(tag));
        });
        setAllTags(Array.from(tags));
      }
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sourceFilter, tagFilter, heatMin, heatMax, dateRange, sortBy]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // 重置所有筛选
  const resetFilters = () => {
    setSearchQuery('');
    setSourceFilter('all');
    setTagFilter(null);
    setHeatMin(null);
    setHeatMax(null);
    setDateRange('all');
    setSortBy('heatScore');
  };

  const sourceIcons: Record<string, string> = {
    youtube: '📺',
    x: '🐦',
    blog: '📝',
    github: '💻',
    xiaohongshu: '📕',
  };

  const sourceLabels: Record<string, string> = {
    youtube: 'YouTube',
    x: 'X / Twitter',
    blog: '博客',
    github: 'GitHub',
    xiaohongshu: '小红书',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-dark-300 dark:to-dark-200">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-dark-100/80 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📡</span>
              <div>
                <h1 className="text-xl font-bold">Playbook Radar</h1>
                <p className="text-xs text-gray-500">OpenClaw 玩法情报站</p>
              </div>
            </div>
            <nav className="flex gap-4 text-sm">
              <a href="/trending" className="hover:text-primary-600">趋势</a>
              <a href="/featured" className="hover:text-primary-600">精选</a>
              <a href="/topics" className="hover:text-primary-600">专题</a>
              <a href="/admin" className="hover:text-primary-600">后台</a>
            </nav>
          </div>
          
          {/* 搜索栏 */}
          <SearchBar 
            onSearch={setSearchQuery} 
            initialValue={searchQuery}
            placeholder="搜索玩法、教程、工具、作者..."
          />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 来源筛选 */}
        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSourceFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sourceFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-dark-100 hover:bg-gray-100'
              }`}
            >
              全部
            </button>
            {['youtube', 'x', 'blog', 'github', 'xiaohongshu'].map((source) => (
              <button
                key={source}
                onClick={() => setSourceFilter(source)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sourceFilter === source
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-dark-100 hover:bg-gray-100'
                }`}
              >
                {sourceIcons[source]} {sourceLabels[source]}
              </button>
            ))}
          </div>
        </div>

        {/* 标签筛选 */}
        {allTags.length > 0 && !searchQuery && (
          <div className="mb-6">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setTagFilter(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  tagFilter === null
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
                }`}
              >
                全部标签
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    tagFilter === tag
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 高级筛选面板 */}
        <div className="mb-8">
          <FilterPanel
            heatMin={heatMin}
            heatMax={heatMax}
            dateRange={dateRange}
            onHeatMinChange={setHeatMin}
            onHeatMaxChange={setHeatMax}
            onDateRangeChange={setDateRange}
            onReset={resetFilters}
          />
        </div>

        {/* 结果统计 */}
        {!loading && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {totalCount === 0 
                ? '暂无内容' 
                : `找到 ${totalCount} 条内容`}
              {(searchQuery || tagFilter || heatMin !== null || heatMax !== null || dateRange !== 'all') && (
                <button
                  onClick={resetFilters}
                  className="ml-2 text-primary-600 hover:underline"
                >
                  清除所有筛选
                </button>
              )}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">排序：</span>
              <button
                onClick={() => setSortBy('heatScore')}
                className={`px-3 py-1 rounded ${
                  sortBy === 'heatScore'
                    ? 'bg-primary-100 text-primary-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                🔥 热度
              </button>
              <button
                onClick={() => setSortBy('publishedAt')}
                className={`px-3 py-1 rounded ${
                  sortBy === 'publishedAt'
                    ? 'bg-primary-100 text-primary-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                🕐 最新
              </button>
            </div>
          </div>
        )}

        {/* 内容列表 */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : totalCount === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">没有找到匹配的内容</p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              清除所有筛选
            </button>
          </div>
        ) : (
          <>
            {/* 热门区（仅当按热度排序且无标签筛选时显示） */}
            {sortBy === 'heatScore' && !tagFilter && sourceFilter === 'all' && !searchQuery && dateRange === 'all' && (
              <section className="mb-12">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="text-xl">🔥</span> 热门玩法
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.filter((i) => i.heatScore >= 8).slice(0, 6).map((item) => (
                    <ItemCard key={item.id} item={item} sourceIcons={sourceIcons} />
                  ))}
                </div>
              </section>
            )}

            {/* 全部列表 */}
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-xl">📋</span> 
                {searchQuery ? `搜索结果` : sortBy === 'publishedAt' ? '全部' : '最新'}
              </h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} sourceIcons={sourceIcons} compact />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function ItemCard({ 
  item, 
  sourceIcons, 
  compact = false 
}: { 
  item: Item; 
  sourceIcons: Record<string, string>;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <article className="bg-white dark:bg-dark-100 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
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
              <a
                href={`/item/${item.id}`}
                className="hover:text-primary-600"
              >
                {item.titleCn || item.titleRaw}
              </a>
            </h2>
            {item.author && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                by {item.author}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mb-3">
              {item.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                  #{tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>👁 {item.views.toLocaleString()}</span>
              <span>👍 {item.likes.toLocaleString()}</span>
              <span>📊 {item.heatScore.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="bg-white dark:bg-dark-100 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
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
          </div>
          <h3 className="text-base font-semibold mb-2">
            <a href={`/item/${item.id}`} className="hover:text-primary-600">
              {item.titleCn || item.titleRaw}
            </a>
          </h3>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>👁 {item.views.toLocaleString()}</span>
            <span>📊 {item.heatScore.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
