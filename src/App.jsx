import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, RefreshCcw, Search, Sparkles } from 'lucide-react';
import StatsGrid from './components/StatsGrid';
import ScannerPanel from './components/ScannerPanel';
import BookForm from './components/BookForm';
import BookCard from './components/BookCard';

const emptyForm = {
  isbn: '',
  title: '',
  author: '',
  genre: '',
  condition: 'Good',
  shelfCode: '',
  totalCopies: 1,
};

const api = axios.create({ baseURL: '/api' });

export default function App() {
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [highlightedBookId, setHighlightedBookId] = useState(null);
  const [submittingBook, setSubmittingBook] = useState(false);

  const loadBooks = useCallback(async () => {
    const response = await api.get('/books', { params: { query, status } });
    setBooks(response.data);
  }, [query, status]);

  const loadStats = useCallback(async () => {
    const response = await api.get('/stats');
    setStats(response.data);
  }, []);

  const reloadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadBooks(), loadStats()]);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load inventory. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [loadBooks, loadStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      reloadAll();
    }, 250);
    return () => clearTimeout(timer);
  }, [reloadAll]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message) => {
    setToast(message);
  };

  const handleScanOrLookup = async (rawCode) => {
    if (!rawCode?.trim()) return;
    try {
      const response = await api.post('/books/resolve', { code: rawCode.trim() });
      const payload = response.data;
      if (payload.source === 'inventory') {
        setHighlightedBookId(payload.book.id);
        showToast(`Found in inventory: ${payload.book.title}`);
      } else {
        const suggestion = payload.suggestion || {};
        setFormData({
          isbn: suggestion.isbn || payload.isbn || '',
          title: suggestion.title || '',
          author: suggestion.author || '',
          genre: suggestion.genre || '',
          condition: suggestion.condition || 'Good',
          shelfCode: suggestion.shelfCode || '',
          totalCopies: suggestion.totalCopies || 1,
        });
        showToast('ISBN found. Review details and save it to inventory.');
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not resolve scanned code.');
    }
  };

  const handleBookSubmit = async (payload) => {
    setSubmittingBook(true);
    try {
      await api.post('/books/manual', payload);
      showToast('Book saved successfully.');
      setFormData(emptyForm);
      await Promise.all([loadBooks(), loadStats()]);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save book.');
    } finally {
      setSubmittingBook(false);
    }
  };

  const handleCheckout = async (bookId, checkoutPayload) => {
    try {
      await api.post(`/books/${bookId}/checkout`, checkoutPayload);
      showToast('Book checked out.');
      await Promise.all([loadBooks(), loadStats()]);
    } catch (err) {
      showToast(err.response?.data?.error || 'Checkout failed.');
    }
  };

  const handleReturn = async (bookId) => {
    try {
      await api.post(`/books/${bookId}/return`);
      showToast('Book returned and stock updated.');
      await Promise.all([loadBooks(), loadStats()]);
    } catch (err) {
      showToast(err.response?.data?.error || 'Return failed.');
    }
  };

  const visibleCountLabel = useMemo(() => `${books.length} titles`, [books.length]);

  return (
    <main className="min-h-screen px-4 pb-12 pt-6 md:px-8">
      <motion.section
        className="mx-auto max-w-6xl space-y-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-ink-700 p-6 text-white shadow-xl md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Circulation Command Center
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">Used Book Inventory System</h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-brand-50 md:text-lg">
                Scan ISBN/QR, add books fast, and manage checkout + return flow for subscribers with real-time stock
                tracking.
              </p>
            </div>
            <BookOpen className="h-12 w-12 shrink-0 text-brand-100 md:h-16 md:w-16" />
          </div>
        </div>

        <StatsGrid stats={stats} />

        <section className="grid gap-4 rounded-3xl bg-white/90 p-4 shadow-lg md:grid-cols-4 md:items-end md:p-6">
          <label className="md:col-span-2">
            <span className="mb-2 block text-base font-semibold text-ink-700">Search by title, author, ISBN, shelf</span>
            <div className="flex min-h-[44px] items-center rounded-xl border border-brand-200 bg-white px-3 shadow-sm">
              <Search className="h-5 w-5 text-brand-500" />
              <input
                className="h-11 w-full bg-transparent px-3 text-base text-ink-700 outline-none"
                placeholder="Try: 9780143127741 or Sapiens"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </label>

          <label>
            <span className="mb-2 block text-base font-semibold text-ink-700">Stock status</span>
            <select
              className="min-h-[44px] w-full rounded-xl border border-brand-200 bg-white px-3 text-base text-ink-700 shadow-sm outline-none"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">All books</option>
              <option value="available">Available only</option>
              <option value="checkedout">Fully checked out</option>
            </select>
          </label>

          <button
            type="button"
            onClick={reloadAll}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-accent-600 px-5 py-3 text-base font-semibold text-white shadow-md transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <RefreshCcw className="h-5 w-5" />
            Refresh
          </button>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <ScannerPanel
            open={scannerOpen}
            onToggle={() => setScannerOpen((open) => !open)}
            onDetected={handleScanOrLookup}
          />
          <BookForm initialValues={formData} onSubmit={handleBookSubmit} submitting={submittingBook} />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-ink-800">Inventory</h2>
            <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-700">
              {visibleCountLabel}
            </span>
          </div>

          {loading && (
            <div className="rounded-2xl bg-white/80 p-6 text-base text-ink-600 shadow-sm">Loading inventory...</div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-base text-red-700 shadow-sm">
              {error}
              <button
                type="button"
                onClick={reloadAll}
                className="mt-3 block min-h-[44px] rounded-lg bg-red-600 px-4 py-2 text-base font-semibold text-white"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && books.length === 0 && (
            <div className="rounded-2xl bg-white p-8 text-center text-base text-ink-600 shadow-sm">
              No books match this search. Try scanning an ISBN or adding a new title above.
            </div>
          )}

          {!loading && !error && books.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {books.map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.25 }}
                >
                  <BookCard
                    book={book}
                    highlighted={highlightedBookId === book.id}
                    onCheckout={handleCheckout}
                    onReturn={handleReturn}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </motion.section>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-2xl bg-ink-800 px-4 py-3 text-base text-white shadow-lg md:left-auto"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
