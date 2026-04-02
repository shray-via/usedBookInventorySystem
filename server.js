import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { execSync } from 'child_process';

const ensurePrismaReady = () => {
  try {
    // Keep schema and generated client aligned on cold boot.
    execSync('npx prisma db push', { stdio: 'inherit' });
  } catch (error) {
    console.error('Prisma bootstrap failed:', error?.message || error);
    throw error;
  }
};

ensurePrismaReady();
const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

const BOOK_SEED = [
  {
    isbn: '9780143127741',
    title: 'The Martian',
    author: 'Andy Weir',
    genre: 'Sci-Fi',
    condition: 'Good',
    shelfCode: 'SF-A1',
    totalCopies: 3,
    availableCopies: 2,
  },
  {
    isbn: '9780062315007',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    genre: 'History',
    condition: 'Very Good',
    shelfCode: 'NF-B3',
    totalCopies: 2,
    availableCopies: 2,
  },
  {
    isbn: '9780307277671',
    title: 'The Road',
    author: 'Cormac McCarthy',
    genre: 'Fiction',
    condition: 'Fair',
    shelfCode: 'FI-C2',
    totalCopies: 2,
    availableCopies: 1,
  },
  {
    isbn: '9780141439518',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    genre: 'Classic',
    condition: 'Good',
    shelfCode: 'CL-D4',
    totalCopies: 4,
    availableCopies: 4,
  },
  {
    isbn: '9780307949486',
    title: 'Ready Player One',
    author: 'Ernest Cline',
    genre: 'Sci-Fi',
    condition: 'Good',
    shelfCode: 'SF-A3',
    totalCopies: 2,
    availableCopies: 2,
  },
  {
    isbn: '9781501128035',
    title: 'It Ends with Us',
    author: 'Colleen Hoover',
    genre: 'Romance',
    condition: 'Like New',
    shelfCode: 'RO-E1',
    totalCopies: 3,
    availableCopies: 3,
  },
  {
    isbn: '9780553380163',
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    genre: 'Science',
    condition: 'Good',
    shelfCode: 'SC-F2',
    totalCopies: 1,
    availableCopies: 1,
  },
  {
    isbn: '9780525566151',
    title: 'Atomic Habits',
    author: 'James Clear',
    genre: 'Self-Help',
    condition: 'Very Good',
    shelfCode: 'SH-G2',
    totalCopies: 5,
    availableCopies: 4,
  },
];

const activeCheckoutSeed = {
  memberName: 'Nina Patel',
  subscriptionPlan: 'Premium Monthly',
  dueAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
};

const normalizeIsbn = (value) => (value || '').replace(/[^0-9Xx]/g, '').toUpperCase();

const extractIsbn = (rawCode) => {
  const code = rawCode?.trim() || '';
  const direct = normalizeIsbn(code);
  if (direct.length === 10 || direct.length === 13) return direct;

  const matches = code.match(/(?:97[89][0-9]{10}|[0-9]{9}[0-9Xx])/g);
  if (!matches || matches.length === 0) return null;
  return normalizeIsbn(matches[0]);
};

const toBookPayload = (body) => {
  const isbn = normalizeIsbn(body.isbn);
  return {
    isbn,
    title: body.title?.trim() || 'Untitled Book',
    author: body.author?.trim() || 'Unknown Author',
    genre: body.genre?.trim() || null,
    condition: body.condition?.trim() || 'Good',
    shelfCode: body.shelfCode?.trim() || 'UNASSIGNED',
    totalCopies: Math.max(1, Number(body.totalCopies || 1)),
    availableCopies: Math.max(0, Number(body.availableCopies ?? body.totalCopies ?? 1)),
    coverUrl: body.coverUrl?.trim() || null,
  };
};

const includeBook = {
  checkouts: {
    where: { returnedAt: null },
    orderBy: { checkedOutAt: 'desc' },
    take: 1,
  },
};

const withActiveCheckout = (book) => ({
  ...book,
  activeCheckout: book.checkouts?.[0] || null,
  checkouts: undefined,
});

const fetchBookMetadata = async (isbn) => {
  try {
    const response = await axios.get(`https://openlibrary.org/isbn/${isbn}.json`, { timeout: 7000 });
    const payload = response.data;
    let authorName = 'Unknown Author';

    if (Array.isArray(payload.authors) && payload.authors.length > 0 && payload.authors[0].key) {
      try {
        const authorResponse = await axios.get(`https://openlibrary.org${payload.authors[0].key}.json`, {
          timeout: 7000,
        });
        authorName = authorResponse.data?.name || authorName;
      } catch {
        authorName = 'Unknown Author';
      }
    }

    return {
      isbn,
      title: payload.title || 'Untitled Book',
      author: authorName,
      genre: Array.isArray(payload.subjects) && payload.subjects[0] ? payload.subjects[0] : 'General',
      condition: 'Good',
      shelfCode: 'UNASSIGNED',
      totalCopies: 1,
      availableCopies: 1,
      coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
    };
  } catch {
    return null;
  }
};

const seedIfEmpty = async () => {
  const count = await prisma.book.count();
  if (count > 0) return;

  for (const book of BOOK_SEED) {
    await prisma.book.create({ data: book });
  }

  const road = await prisma.book.findUnique({ where: { isbn: '9780307277671' } });
  if (road) {
    await prisma.checkout.create({
      data: {
        bookId: road.id,
        ...activeCheckoutSeed,
      },
    });
  }
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/stats', async (req, res, next) => {
  try {
    const totalTitles = await prisma.book.count();
    const books = await prisma.book.findMany({
      select: {
        totalCopies: true,
        availableCopies: true,
      },
    });
    const activeCheckouts = await prisma.checkout.findMany({
      where: { returnedAt: null },
      select: { memberName: true },
    });

    const totalCopies = books.reduce((sum, book) => sum + book.totalCopies, 0);
    const availableCopies = books.reduce((sum, book) => sum + book.availableCopies, 0);
    const checkedOutCopies = Math.max(0, totalCopies - availableCopies);
    const activeMembers = new Set(activeCheckouts.map((row) => row.memberName)).size;

    res.json({ totalTitles, totalCopies, availableCopies, checkedOutCopies, activeMembers });
  } catch (error) {
    next(error);
  }
});

app.get('/api/books', async (req, res, next) => {
  try {
    const query = req.query.query?.toString().trim() || '';
    const status = req.query.status?.toString().trim() || 'all';

    const andWhere = [];
    if (query) {
      andWhere.push({
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { author: { contains: query, mode: 'insensitive' } },
          { isbn: { contains: query, mode: 'insensitive' } },
          { shelfCode: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    if (status === 'available') andWhere.push({ availableCopies: { gt: 0 } });
    if (status === 'checkedout') andWhere.push({ availableCopies: { equals: 0 } });

    const books = await prisma.book.findMany({
      where: andWhere.length > 0 ? { AND: andWhere } : undefined,
      orderBy: [{ updatedAt: 'desc' }, { title: 'asc' }],
      include: includeBook,
    });

    res.json(books.map(withActiveCheckout));
  } catch (error) {
    next(error);
  }
});

app.post('/api/books/resolve', async (req, res, next) => {
  try {
    const isbn = extractIsbn(req.body.code);
    if (!isbn || (isbn.length !== 10 && isbn.length !== 13)) {
      return res.status(400).json({ error: 'Could not detect a valid ISBN from the scanned code.' });
    }

    const existing = await prisma.book.findUnique({
      where: { isbn },
      include: includeBook,
    });
    if (existing) {
      return res.json({ source: 'inventory', book: withActiveCheckout(existing) });
    }

    const metadata = await fetchBookMetadata(isbn);
    return res.json({
      source: 'lookup',
      isbn,
      suggestion: metadata || {
        isbn,
        title: '',
        author: '',
        genre: '',
        condition: 'Good',
        shelfCode: 'UNASSIGNED',
        totalCopies: 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/books/manual', async (req, res, next) => {
  try {
    const payload = toBookPayload(req.body);
    if (!payload.isbn || (payload.isbn.length !== 10 && payload.isbn.length !== 13)) {
      return res.status(400).json({ error: 'ISBN must be 10 or 13 characters (digits/X).' });
    }

    const existing = await prisma.book.findUnique({ where: { isbn: payload.isbn } });
    const saved = existing
      ? await prisma.book.update({
          where: { isbn: payload.isbn },
          data: {
            ...payload,
            availableCopies: Math.min(payload.availableCopies, payload.totalCopies),
          },
          include: includeBook,
        })
      : await prisma.book.create({
          data: {
            ...payload,
            availableCopies: Math.min(payload.availableCopies, payload.totalCopies),
          },
          include: includeBook,
        });

    res.json(withActiveCheckout(saved));
  } catch (error) {
    next(error);
  }
});

app.post('/api/books/:id/checkout', async (req, res, next) => {
  try {
    const bookId = Number(req.params.id);
    const memberName = req.body.memberName?.trim();
    const subscriptionPlan = req.body.subscriptionPlan?.trim() || 'Monthly';
    const dueAt = req.body.dueAt ? new Date(req.body.dueAt) : null;

    if (!memberName) return res.status(400).json({ error: 'Member name is required.' });

    const result = await prisma.$transaction(async (tx) => {
      const book = await tx.book.findUnique({ where: { id: bookId } });
      if (!book) throw new Error('BOOK_NOT_FOUND');
      if (book.availableCopies < 1) throw new Error('NO_COPIES');

      await tx.checkout.create({
        data: {
          bookId,
          memberName,
          subscriptionPlan,
          dueAt: dueAt && !Number.isNaN(dueAt.getTime()) ? dueAt : null,
        },
      });

      return tx.book.update({
        where: { id: bookId },
        data: { availableCopies: { decrement: 1 } },
        include: includeBook,
      });
    });

    res.json(withActiveCheckout(result));
  } catch (error) {
    if (error.message === 'BOOK_NOT_FOUND') return res.status(404).json({ error: 'Book not found.' });
    if (error.message === 'NO_COPIES') return res.status(409).json({ error: 'No available copies left.' });
    next(error);
  }
});

app.post('/api/books/:id/return', async (req, res, next) => {
  try {
    const bookId = Number(req.params.id);

    const result = await prisma.$transaction(async (tx) => {
      const active = await tx.checkout.findFirst({
        where: { bookId, returnedAt: null },
        orderBy: { checkedOutAt: 'asc' },
      });
      if (!active) throw new Error('NO_ACTIVE_CHECKOUT');

      await tx.checkout.update({
        where: { id: active.id },
        data: { returnedAt: new Date() },
      });

      return tx.book.update({
        where: { id: bookId },
        data: { availableCopies: { increment: 1 } },
        include: includeBook,
      });
    });

    res.json(withActiveCheckout(result));
  } catch (error) {
    if (error.message === 'NO_ACTIVE_CHECKOUT') {
      return res.status(409).json({ error: 'This book is not currently checked out.' });
    }
    next(error);
  }
});

app.post('/api/__via/telemetry', (req, res) => {
  const logDir = '/var/log/via';
  fs.mkdirSync(logDir, { recursive: true });
  const events = Array.isArray(req.body) ? req.body : [req.body];
  for (const event of events) {
    const line = `${JSON.stringify(event)}\n`;
    fs.appendFileSync(path.join(logDir, 'telemetry.jsonl'), line);
    if (event.type === 'error' || (event.type === 'console' && event.level === 'error')) {
      fs.appendFileSync(path.join(logDir, 'errors.jsonl'), line);
    }
  }
  res.json({ ok: true });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: error.message || 'Unexpected server error' });
});

const PORT = process.env.PORT || 3001;

seedIfEmpty()
  .then(() => {
    app.listen(PORT, () => console.log(`Express listening on :${PORT}`));
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
