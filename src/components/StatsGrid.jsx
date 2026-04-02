import { BookCheck, BookCopy, BookOpenCheck, Users } from 'lucide-react';

const cards = [
  {
    key: 'totalTitles',
    label: 'Total Titles',
    icon: BookCopy,
    color: 'bg-brand-100 text-brand-700',
  },
  {
    key: 'availableCopies',
    label: 'Available Copies',
    icon: BookOpenCheck,
    color: 'bg-accent-100 text-accent-700',
  },
  {
    key: 'checkedOutCopies',
    label: 'Checked Out',
    icon: BookCheck,
    color: 'bg-amber-100 text-amber-700',
  },
  {
    key: 'activeMembers',
    label: 'Active Members',
    icon: Users,
    color: 'bg-ink-100 text-ink-700',
  },
];

export default function StatsGrid({ stats }) {
  return (
    <section className="grid grid-cols-2 gap-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article key={card.key} className="rounded-xl bg-white/90 p-3 shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-ink-600">{card.label}</p>
              <span className={`rounded-full p-1.5 ${card.color}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-ink-800">{stats?.[card.key] ?? '--'}</p>
          </article>
        );
      })}
    </section>
  );
}
