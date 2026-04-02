import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { PlusCircle, RefreshCcw, ScanLine, Search, Users } from 'lucide-react';
import StatsGrid from './components/StatsGrid';
import ScannerPanel from './components/ScannerPanel';
import BookForm from './components/BookForm';
import BookCard from './components/BookCard';
import MemberForm from './components/MemberForm';

const emptyForm = {
  isbn: '',
  title: '',
  author: '',
  genre: '',
  condition: 'Good',
  shelfCode: '',
  coverUrl: '',
  totalCopies: 1,
};

const api = axios.create({ baseURL: '/api' });

export default function App() {
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [activePanel, setActivePanel] = useState('scan');
  const [toast, setToast] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [highlightedBookId, setHighlightedBookId] = useState(null);
  const [submittingBook, setSubmittingBook] = useState(false);
  const [submittingMember, setSubmittingMember] = useState(false);

  const loadBooks = useCallback(async () => {
    const response = await api.get('/books', { params: { query, status } });
    setBooks(Array.isArray(response.data) ? response.data : []);
  }, [query, status]);

  const loadStats = useCallback(async () => {
    const response = await api.get('/stats');
    setStats(response.data);
  }, []);

  const loadMembers = useCallback(async () => {
    const response = await api.get('/members');
    setMembers(response.data);
  }, []);

  const reloadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadBooks(), loadStats(), loadMembers()]);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load inventory. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [loadBooks, loadStats, loadMembers]);

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

  useEffect(() => {
    if (activePanel === 'scan' && !scannerOpen) {
      setScannerOpen(true);
    }
  }, [activePanel, scannerOpen]);

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
          coverUrl: suggestion.coverUrl || '',
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
      const response = await api.post('/books/manual', payload);
      const title = response.data?.title;
      showToast(title ? `Saved: ${title}` : 'Book saved successfully.');
      setFormData(emptyForm);
      await Promise.all([loadBooks(), loadStats()]);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save book.');
    } finally {
      setSubmittingBook(false);
    }
  };

  const handleDeleteBook = async (bookId) => {
    const confirmed = window.confirm('Delete this book from inventory?');
    if (!confirmed) return;
    try {
      await api.delete(`/books/${bookId}`);
      showToast('Book deleted.');
      await Promise.all([loadBooks(), loadStats()]);
    } catch (err) {
      showToast(err.response?.data?.error || 'Delete failed.');
    }
  };

  const handleMemberSubmit = async (payload) => {
    setSubmittingMember(true);
    try {
      await api.post('/members', payload);
      showToast('Subscriber saved.');
      await Promise.all([loadMembers(), loadStats()]);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save subscriber.');
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleCheckout = async (bookId, checkoutPayload) => {
    try {
      await api.post(`/books/${bookId}/checkout`, checkoutPayload);
      showToast('Book checked out.');
      await Promise.all([loadBooks(), loadStats(), loadMembers()]);
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
    <main className="min-h-screen px-4 pb-10 pt-4 md:px-8">
      <motion.section
        className="mx-auto max-w-6xl space-y-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <section className="rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-ink-700 p-4 text-white shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-4xl">Book Inventory</h1>
              <p className="mt-1 text-base text-brand-50">Scan, checkout, and return in a few taps.</p>
            </div>
            <button
              type="button"
              onClick={reloadAll}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-white/20 p-2 text-white transition-all hover:bg-white/30 active:scale-[0.98]"
              aria-label="Refresh inventory"
            >
              <RefreshCcw className="h-5 w-5" />
            </button>
          </div>
        </section>

        <StatsGrid stats={stats} />

        <section className="grid gap-3 rounded-2xl bg-white/95 p-3 shadow-lg md:grid-cols-4 md:items-end md:p-4">
          <div className="grid grid-cols-3 gap-2 md:col-span-1">
            <button
              type="button"
              onClick={() => setActivePanel('scan')}
              className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-base font-semibold transition-all ${
                activePanel === 'scan' ? 'bg-accent-600 text-white' : 'bg-ink-100 text-ink-700'
              }`}
            >
              <ScanLine className="h-5 w-5" />
              Scan
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('add')}
              className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-base font-semibold transition-all ${
                activePanel === 'add' ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-700'
              }`}
            >
              <PlusCircle className="h-5 w-5" />
              Add
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('members')}
              className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-base font-semibold transition-all ${
                activePanel === 'members' ? 'bg-ink-700 text-white' : 'bg-ink-100 text-ink-700'
              }`}
            >
              <Users className="h-5 w-5" />
              Members
            </button>
          </div>

          <label className="md:col-span-2">
            <span className="mb-1 block text-base font-semibold text-ink-700">Find Book</span>
            <div className="flex min-h-[44px] items-center rounded-xl border border-brand-200 bg-white px-3 shadow-sm">
              <Search className="h-5 w-5 text-brand-500" />
              <input
                className="h-11 w-full bg-transparent px-3 text-base text-ink-700 outline-none"
                placeholder="Title, author, ISBN, shelf"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </label>

          <label className="md:col-span-1">
            <span className="mb-1 block text-base font-semibold text-ink-700">Filter</span>
            <select
              className="min-h-[44px] w-full rounded-xl border border-brand-200 bg-white px-3 text-base text-ink-700 shadow-sm outline-none"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="checkedout">Checked Out</option>
            </select>
          </label>
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          {activePanel === 'scan' && (
            <ScannerPanel
              open={scannerOpen}
              onToggle={() => setScannerOpen((open) => !open)}
              onDetected={handleScanOrLookup}
            />
          )}
          {activePanel === 'add' && (
            <BookForm initialValues={formData} onSubmit={handleBookSubmit} submitting={submittingBook} />
          )}
          {activePanel === 'members' && (
            <MemberForm members={members} onSubmit={handleMemberSubmit} submitting={submittingMember} />
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-ink-800 md:text-2xl">Inventory</h2>
            <span className="rounded-full bg-brand-100 px-3 py-1 text-base font-semibold text-brand-700">
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
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {books.map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                >
                  <BookCard
                    book={book}
                    members={members}
                    highlighted={highlightedBookId === book.id}
                    onCheckout={handleCheckout}
                    onReturn={handleReturn}
                    onDelete={handleDeleteBook}
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
            className="fixed bottom-3 left-3 right-3 z-50 mx-auto max-w-lg rounded-2xl bg-ink-800 px-4 py-3 text-base text-white shadow-lg md:left-auto"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
