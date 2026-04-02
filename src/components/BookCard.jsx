import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { BookOpenCheck, CornerDownLeft, MapPinned, UserRound } from 'lucide-react';

export default function BookCard({ book, members, highlighted, onCheckout, onReturn }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberId, setMemberId] = useState(members[0]?.id ? String(members[0].id) : '');
  const [subscriptionPlan, setSubscriptionPlan] = useState('Monthly');
  const [dueAt, setDueAt] = useState('');

  const available = book.availableCopies > 0;

  useEffect(() => {
    if (!memberId && members[0]?.id) {
      setMemberId(String(members[0].id));
    }
  }, [memberId, members]);

  const handleCheckoutSubmit = (event) => {
    event.preventDefault();
    if (!memberId && !memberName.trim()) return;
    onCheckout(book.id, {
      memberId: memberId ? Number(memberId) : null,
      memberName,
      subscriptionPlan,
      dueAt: dueAt || null,
    });
    setMemberName('');
    setSubscriptionPlan('Monthly');
    setDueAt('');
    setCheckoutOpen(false);
  };

  return (
    <article
      className={clsx(
        'rounded-xl bg-white p-3 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg',
        highlighted && 'ring-2 ring-accent-500'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={`${book.title} cover`}
              className="h-16 w-12 rounded-md object-cover shadow-sm"
              loading="lazy"
            />
          ) : (
            <div className="flex h-16 w-12 items-center justify-center rounded-md bg-brand-100 text-xs font-semibold text-brand-700">
              No Img
            </div>
          )}
          <div>
            <h3 className="text-base font-bold tracking-tight text-ink-800">{book.title}</h3>
            <p className="mt-0.5 text-base text-ink-600">{book.author}</p>
            <p className="mt-0.5 text-base font-medium text-ink-500">{book.isbn}</p>
          </div>
        </div>
        <span
          className={clsx(
            'rounded-full px-2 py-1 text-base font-semibold',
            available ? 'bg-accent-100 text-accent-700' : 'bg-amber-100 text-amber-700'
          )}
        >
          {available ? 'In' : 'Out'}
        </span>
      </div>

      <div className="mt-2 grid gap-1 text-base text-ink-700">
        <p className="inline-flex items-center gap-1.5">
          <MapPinned className="h-4 w-4 text-brand-600" />
          {book.shelfCode}
        </p>
        <p className="inline-flex items-center gap-1.5">
          <BookOpenCheck className="h-4 w-4 text-brand-600" />
          {book.availableCopies} / {book.totalCopies} copies
        </p>
      </div>

      {book.activeCheckout && (
        <div className="mt-3 rounded-xl bg-brand-50 p-3 text-base text-ink-700">
          <p className="inline-flex items-center gap-2 font-semibold">
            <UserRound className="h-4 w-4 text-brand-600" />
            {book.activeCheckout.memberName}
          </p>
          <p className="mt-1">Plan: {book.activeCheckout.subscriptionPlan}</p>
          {book.activeCheckout.dueAt && <p className="mt-1">Due: {new Date(book.activeCheckout.dueAt).toLocaleDateString()}</p>}
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-2">
        {available ? (
          <button
            type="button"
            onClick={() => setCheckoutOpen((open) => !open)}
            className="min-h-[44px] rounded-xl bg-accent-600 px-4 py-2 text-base font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Checkout
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onReturn(book.id)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-base font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <CornerDownLeft className="h-5 w-5" />
            Return
          </button>
        )}
      </div>

      {checkoutOpen && (
        <form onSubmit={handleCheckoutSubmit} className="mt-3 space-y-2 rounded-xl bg-ink-50 p-3">
          {members.length > 0 && (
            <label className="block">
              <span className="mb-1 block text-base font-semibold text-ink-700">Select Subscriber</span>
              <select
                className="min-h-[44px] w-full rounded-lg border border-brand-200 px-3 text-base outline-none"
                value={memberId}
                onChange={(event) => setMemberId(event.target.value)}
              >
                <option value="">Custom name</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-base font-semibold text-ink-700">Member Name</span>
            <input
              required={!memberId}
              className="min-h-[44px] w-full rounded-lg border border-brand-200 px-3 text-base outline-none"
              value={memberName}
              onChange={(event) => setMemberName(event.target.value)}
              placeholder={memberId ? 'Optional override' : 'Subscriber name'}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-base font-semibold text-ink-700">Plan</span>
            <select
              className="min-h-[44px] w-full rounded-lg border border-brand-200 px-3 text-base outline-none"
              value={subscriptionPlan}
              onChange={(event) => setSubscriptionPlan(event.target.value)}
            >
              <option>Monthly</option>
              <option>Premium Monthly</option>
              <option>Quarterly</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-base font-semibold text-ink-700">Due Date (optional)</span>
            <input
              type="date"
              className="min-h-[44px] w-full rounded-lg border border-brand-200 px-3 text-base outline-none"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
            />
          </label>
          <button
            type="submit"
            className="min-h-[44px] w-full rounded-lg bg-ink-700 px-4 py-2 text-base font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Confirm Checkout
          </button>
        </form>
      )}
    </article>
  );
}
