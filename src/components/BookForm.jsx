import { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';

export default function BookForm({ initialValues, onSubmit, submitting }) {
  const [form, setForm] = useState(initialValues);

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      totalCopies: Number(form.totalCopies || 1),
    });
  };

  return (
    <section className="rounded-2xl bg-white/90 p-5 shadow-lg">
      <h3 className="text-xl font-bold tracking-tight text-ink-800">Add or Update Book</h3>
      <p className="mt-1 text-base text-ink-600">Works with scanned ISBNs or manual entry for quick catalog updates.</p>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="md:col-span-2">
          <span className="mb-1 block text-base font-semibold text-ink-700">ISBN</span>
          <input
            required
            minLength={10}
            maxLength={17}
            className="min-h-[44px] w-full rounded-xl border border-brand-200 px-3 text-base outline-none"
            value={form.isbn}
            onChange={(event) => setField('isbn', event.target.value)}
            placeholder="9780143127741"
          />
        </label>

        <label className="md:col-span-2">
          <span className="mb-1 block text-base font-semibold text-ink-700">Title</span>
          <input
            required
            className="min-h-[44px] w-full rounded-xl border border-brand-200 px-3 text-base outline-none"
            value={form.title}
            onChange={(event) => setField('title', event.target.value)}
            placeholder="Book title"
          />
        </label>

        <label className="md:col-span-2">
          <span className="mb-1 block text-base font-semibold text-ink-700">Author</span>
          <input
            required
            className="min-h-[44px] w-full rounded-xl border border-brand-200 px-3 text-base outline-none"
            value={form.author}
            onChange={(event) => setField('author', event.target.value)}
            placeholder="Author name"
          />
        </label>

        <label>
          <span className="mb-1 block text-base font-semibold text-ink-700">Genre</span>
          <input
            className="min-h-[44px] w-full rounded-xl border border-brand-200 px-3 text-base outline-none"
            value={form.genre}
            onChange={(event) => setField('genre', event.target.value)}
            placeholder="Fiction / Science"
          />
        </label>

        <label>
          <span className="mb-1 block text-base font-semibold text-ink-700">Condition</span>
          <select
            className="min-h-[44px] w-full rounded-xl border border-brand-200 px-3 text-base outline-none"
            value={form.condition}
            onChange={(event) => setField('condition', event.target.value)}
          >
            <option>Like New</option>
            <option>Very Good</option>
            <option>Good</option>
            <option>Fair</option>
            <option>Worn</option>
          </select>
        </label>

        <label>
          <span className="mb-1 block text-base font-semibold text-ink-700">Shelf Code</span>
          <input
            required
            className="min-h-[44px] w-full rounded-xl border border-brand-200 px-3 text-base outline-none"
            value={form.shelfCode}
            onChange={(event) => setField('shelfCode', event.target.value)}
            placeholder="SF-A1"
          />
        </label>

        <label>
          <span className="mb-1 block text-base font-semibold text-ink-700">Total Copies</span>
          <input
            type="number"
            min={1}
            className="min-h-[44px] w-full rounded-xl border border-brand-200 px-3 text-base outline-none"
            value={form.totalCopies}
            onChange={(event) => setField('totalCopies', event.target.value)}
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="md:col-span-2 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-base font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <PlusCircle className="h-5 w-5" />
          {submitting ? 'Saving...' : 'Save Book'}
        </button>
      </form>
    </section>
  );
}
