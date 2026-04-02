import { useState } from 'react';
import clsx from 'clsx';
import { BookOpenCheck, CornerDownLeft, MapPinned, UserRound } from 'lucide-react';

export default function BookCard({ book, highlighted, onCheckout, onReturn }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [subscriptionPlan, setSubscriptionPlan] = useState('Monthly');
  const [dueAt, setDueAt] = useState('');

  const available = book.availableCopies > 0;

  const handleCheckoutSubmit = (event) => {
    event.preventDefault();
    if (!memberName.trim()) return;
    onCheckout(book.id, { memberName, subscriptionPlan, dueAt: dueAt || null });
    setMemberName('');
    setSubscriptionPlan('Monthly');
    setDueAt('');
    setCheckoutOpen(false);
  };

  return (
    <article
      className={clsx(
        'rounded-2xl bg-white p-5 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg',
        highlighted && 'ring-2 ring-accent-500'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-ink-800">{book.title}</h3>
          <p className="mt-1 text-base text-ink-600">{book.author}</p>
          <p className="mt-1 text-sm font-medium text-ink-500">ISBN {book.isbn}</p>
        </div>
        <span
          className={clsx(
            'rounded-full px-3 py-1 text-sm font-semibold',
            available ? 'bg-accent-100 text-accent-700' : 'bg-amber-100 text-amber-700'
          )}
        >
          {available ? 'Available' : 'Checked Out'}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-base text-ink-700">
        <p className="inline-flex items-center gap-2">
          <MapPinned className="h-4 w-4 text-brand-600" />
          Shelf {book.shelfCode}
        </p>
        <p className="inline-flex items-center gap-2">
          <BookOpenCheck className="h-4 w-4 text-brand-600" />
          Copies: {book.availableCopies} / {book.totalCopies}
        </p>
        <p className="text-sm text-ink-500">Condition: {book.condition}</p>
      </div>

      {book.activeCheckout && (
        <div className="mt-4 rounded-xl bg-brand-50 p-3 text-sm text-ink-700">
          <p className="inline-flex items-center gap-2 font-semibold">
            <UserRound className="h-4 w-4 text-brand-600" />
            Checked out by {book.activeCheckout.memberName}
          </p>
          <p className="mt-1">Plan: {book.activeCheckout.subscriptionPlan}</p>
          {book.activeCheckout.dueAt && (
            <p className="mt-1">Due: {new Date(book.activeCheckout.dueAt).toLocaleDateString()}</p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {available ? (
          <button
            type="button"
            onClick={() => setCheckoutOpen((v) => !v)}
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
            Return Book
          </button>
        )}
      </div>

      {checkoutOpen && (
        <form onSubmit={handleCheckoutSubmit} className="mt-4 space-y-2 rounded-xl bg-ink-50 p-3">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink-700">Member Name</span>
            <input
              required
              className="min-h-[44px] w-full rounded-lg border border-brand-200 px-3 text-base outline-none"
              value={memberName}
              onChange={(event) => setMemberName(event.target.value)}
              placeholder="Subscriber name"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink-700">Subscription Plan</span>
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
            <span className="mb-1 block text-sm font-semibold text-ink-700">Due Date (optional)</span>
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
