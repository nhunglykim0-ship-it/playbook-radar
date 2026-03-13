'use client';

interface FilterPanelProps {
  heatMin: number | null;
  heatMax: number | null;
  dateRange: string;
  onHeatMinChange: (value: number | null) => void;
  onHeatMaxChange: (value: number | null) => void;
  onDateRangeChange: (value: string) => void;
  onReset: () => void;
}

export default function FilterPanel({
  heatMin,
  heatMax,
  dateRange,
  onHeatMinChange,
  onHeatMaxChange,
  onDateRangeChange,
  onReset,
}: FilterPanelProps) {
  const hasActiveFilters = heatMin !== null || heatMax !== null || dateRange !== 'all';

  return (
    <div className="bg-white dark:bg-dark-100 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-700 dark:text-gray-300">🎯 高级筛选</h3>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
          >
            重置筛选
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* 热度区间 */}
        <div>
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
            🔥 热度区间
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="0"
              min="0"
              max="10"
              step="0.1"
              value={heatMin ?? ''}
              onChange={(e) => onHeatMinChange(e.target.value ? parseFloat(e.target.value) : null)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-primary-400"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              placeholder="10"
              min="0"
              max="10"
              step="0.1"
              value={heatMax ?? ''}
              onChange={(e) => onHeatMaxChange(e.target.value ? parseFloat(e.target.value) : null)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-primary-400"
            />
          </div>
        </div>

        {/* 时间范围 */}
        <div>
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
            📅 时间范围
          </label>
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-primary-400"
          >
            <option value="all">全部时间</option>
            <option value="today">今天</option>
            <option value="week">最近 7 天</option>
            <option value="month">最近 30 天</option>
          </select>
        </div>

        {/* 排序 */}
        <div>
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
            📊 排序方式
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => onDateRangeChange(dateRange)} // 触发刷新
              className="flex-1 px-3 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-sm font-medium"
            >
              🔥 热度优先
            </button>
            <button
              onClick={() => onDateRangeChange(dateRange)}
              className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              🕐 最新优先
            </button>
          </div>
        </div>
      </div>

      {/* 活跃筛选条件展示 */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {heatMin !== null && (
              <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
                热度 ≥ {heatMin}
              </span>
            )}
            {heatMax !== null && (
              <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
                热度 ≤ {heatMax}
              </span>
            )}
            {dateRange !== 'all' && (
              <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
                {dateRange === 'today' && '今天'}
                {dateRange === 'week' && '最近 7 天'}
                {dateRange === 'month' && '最近 30 天'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
