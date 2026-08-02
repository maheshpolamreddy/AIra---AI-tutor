import { AnimatePresence } from 'framer-motion';
import type { TopicCardModel } from '../../../hooks/useDashboardInsights';
import { FilterPills, SearchBar } from './FilterPills';
import TopicCard from './TopicCard';

type TopicDiscoveryProps = {
  searchQuery: string;
  onSearch: (v: string) => void;
  activeCategory: string;
  onCategory: (c: string) => void;
  topics: TopicCardModel[];
  onStart: (topicId: string) => void;
};

export default function TopicDiscovery({
  searchQuery,
  onSearch,
  activeCategory,
  onCategory,
  topics,
  onStart,
}: TopicDiscoveryProps) {
  return (
    <section style={{ marginTop: 'var(--dash-section-gap)' }}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-3 sm:mb-4">
        <div>
          <h2 className="dash-section-title">Topic discovery</h2>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--dash-text-2)' }}>
            Missions ranked from your live progress
          </p>
        </div>
        <SearchBar value={searchQuery} onChange={onSearch} />
      </div>

      <FilterPills active={activeCategory} onChange={onCategory} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        <AnimatePresence mode="popLayout">
          {topics.map((topic, index) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              index={index}
              onStart={() => onStart(topic.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {topics.length === 0 && (
        <div
          className="mt-2 rounded-2xl border border-dashed py-12 text-center"
          style={{ borderColor: 'var(--dash-border)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--dash-text-2)' }}>
            No missions match that filter
          </p>
        </div>
      )}
    </section>
  );
}
