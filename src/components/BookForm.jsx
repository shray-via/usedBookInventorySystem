import { useEffect, useMemo, useState } from 'react';
import { PlusCircle } from 'lucide-react';

export default function BookForm({ initialValues, onSubmit, submitting }) {
  const [form, setForm] = useState(initialValues);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  const showOptionalHint = useMemo(
    () =>
      Boolean(
        initialValues.title ||
          initialValues.author ||
          initialValues.genre ||
          initialValues.coverUrl ||
          initialValues.shelfCode
      ),
    [initialValues]
  );

  useEffect(() => {
    if (showOptionalHint) setAdvancedOpen(true);
  }, [showOptionalHint]);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setField('coverUrl', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      totalCopies: Number(form.totalCopies || 1),
    });
  };

  return (
    <section className="rounded-2xl bg-white/90 p-4 shadow-lg">
      <h3 className="text-lg font-bold tracking-tight text-ink-800">Add Book</h3>
      <p className="mt-1 text-base text-ink-600">Just enter ISBN and tap save. Everything else is optional.</p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1 block text-base font-semibold text-ink-700">ISBN (required)</span>
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

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-base font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <PlusCircle className="h-5 w-5" />
          {submitting ? 'Saving...' : 'Save With ISBN'}
        </button>

        <button
          type="button"
          onClick={() => setAdvancedOpen((open) => !open)}
          className="min-h-[44px] w-full rounded-xl bg-ink-100 px-4 py-2 text-base font-semibold text-ink-700 transition-all hover:bg-ink-200 active:scale-[0.98]"
        >
          {advancedOpen ? 'Hide Optional Details' : 'Show Optional Details'}
        </button>

        {advancedOpen && (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="mb-1 block text-base font-semibold text-ink-700">Title (optional)</span>
              <input
                className="min-h-[44px] w-full rounded-xl border border-brand-200 px-3 text-base outline-none"
                value={form.title}
                onChange={(event) => setField('title', event.target.value)}
                placeholder="Book title"
              />
            </label>

            <label>
              <span className="mb-1 block text-base font-semibold text-ink-700">Author (optional)</span>
              <input
                className="min-h-[44px] w-full rounded-xl border border-brand-200 px-3 text-base outline-none"
                value={form.author}
                onChange={(event) => setField('author', event.target.value)}
                placeholder="Author name"
              />
            </label>

            <label>
              <span className="mb-1 block text-base font-semibold text-ink-700">Shelf Code (optional)</span>
              <input
                className="min-h-[44px] w-full rounded-xl border border-brand-200 px-3 text-base outline-none"
                value={form.shelfCode}
                onChange={(event) => setField('shelfCode', event.target.value)}
                placeholder="UNASSIGNED"
              />
            </label>

            <label>
              <span className="mb-1 block text-base font-semibold text-ink-700">Genre (optional)</span>
              <input
                className="min-h-[44px] w-full rounded-xl border border-brand-200 px-3 text-base outline-none"
                value={form.genre}
                onChange={(event) => setField('genre', event.target.value)}
                placeholder="Fiction / Science"
              />
            </label>

            <label>
              <span className="mb-1 block text-base font-semibold text-ink-700">Condition (optional)</span>
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
              <span className="mb-1 block text-base font-semibold text-ink-700">Total Copies (optional)</span>
              <input
                type="number"
                min={1}
                className="min-h-[44px] w-full rounded-xl border border-brand-200 px-3 text-base outline-none"
                value={form.totalCopies}
                onChange={(event) => setField('totalCopies', event.target.value)}
              />
            </label>

            <label className="md:col-span-2">
              <span className="mb-1 block text-base font-semibold text-ink-700">Book Photo (optional)</span>
              <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                <input
                  className="min-h-[44px] w-full rounded-xl border border-brand-200 px-3 text-base outline-none"
                  value={form.coverUrl || ''}
                  onChange={(event) => setField('coverUrl', event.target.value)}
                  placeholder="https://... or upload below"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="min-h-[44px] w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-base"
                />
              </div>
              {form.coverUrl && (
                <img src={form.coverUrl} alt="Book cover preview" className="mt-2 h-20 w-14 rounded-md object-cover shadow-sm" />
              )}
            </label>
          </div>
        )}
      </form>
    </section>
  );
}
