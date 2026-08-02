import type { ReactNode } from 'react';
import { ChevronRight, Trophy } from 'lucide-react';
import { UserAvatar, displayNameForUser } from '../../common/UserAvatar';
import type { User } from '../../../types';

type ActionCardProps = {
  onClick: () => void;
  icon: ReactNode;
  title: string;
  body: string;
};

export function ActionCard({ onClick, icon, title, body }: ActionCardProps) {
  return (
    <button type="button" onClick={onClick} className="dash-card dash-card--interactive text-left w-full group">
      <div className="flex items-center gap-2.5 mb-2">
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center border"
          style={{
            background: 'var(--dash-surface-1)',
            borderColor: 'var(--dash-border)',
          }}
        >
          {icon}
        </span>
        <span className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>
          {title}
        </span>
      </div>
      <p className="text-xs leading-relaxed line-clamp-2 mb-2" style={{ color: 'var(--dash-text-2)' }}>
        {body}
      </p>
      <span
        className="inline-flex items-center text-[11px] font-semibold group-hover:translate-x-0.5 transition-transform"
        style={{ color: 'var(--dash-brand)', transitionDuration: 'var(--dash-hover-ms)' }}
      >
        Open <ChevronRight className="w-3.5 h-3.5" />
      </span>
    </button>
  );
}

type ProfileCardProps = {
  user: User | null | undefined;
  profession?: string;
  badgeCount: number;
  onClick: () => void;
};

export function ProfileCard({ user, profession, badgeCount, onClick }: ProfileCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[var(--dash-radius-lg)] text-left p-4 transition-all group"
      style={{
        background: 'linear-gradient(145deg, #0f172a, #1e1b4b)',
        boxShadow: 'var(--dash-shadow-3)',
        transitionDuration: 'var(--dash-hover-ms)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(79,70,229,0.35)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = 'var(--dash-shadow-3)';
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <UserAvatar
          user={user}
          size={36}
          className="ring-2 ring-white/15"
          fallbackClassName="bg-indigo-500 text-xs font-bold"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{displayNameForUser(user)}</p>
          <p className="text-[11px] text-white/55 uppercase tracking-wide truncate">
            {profession || 'Explorer'}
          </p>
        </div>
      </div>
      <div className="flex items-center text-[11px] font-semibold text-white/70 group-hover:text-white">
        <Trophy className="w-3.5 h-3.5 mr-1.5" />
        {badgeCount} badges
        <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
}

type QuickAccessProps = {
  children: ReactNode;
};

export default function QuickAccess({ children }: QuickAccessProps) {
  return (
    <section style={{ marginTop: 'var(--dash-section-gap)' }}>
      <div className="mb-3 sm:mb-4">
        <h2 className="dash-section-title">Quick access</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--dash-text-2)' }}>
          Jump across the learning system
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">{children}</div>
    </section>
  );
}
