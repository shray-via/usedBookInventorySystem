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

const normalizeIsbn = (value) => (value || '').replace(/[^0-9Xx]/g, '').toUpperCase();
const hasValue = (value) => {
  if (typeof value === 'string') return value.trim() !== '';
  return value !== undefined && value !== null;
};

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

const toMemberPayload = (body) => ({
  name: body.name?.trim() || '',
  phone: body.phone?.trim() || null,
  email: body.email?.trim() || null,
  plan: body.plan?.trim() || 'Monthly',
  active: body.active ?? true,
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
    const activeMembers = await prisma.member.count({ where: { active: true } });

    const totalCopies = books.reduce((sum, book) => sum + book.totalCopies, 0);
    const availableCopies = books.reduce((sum, book) => sum + book.availableCopies, 0);
    const checkedOutCopies = Math.max(0, totalCopies - availableCopies);

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

app.get('/api/members', async (req, res, next) => {
  try {
    const members = await prisma.member.findMany({
      where: { active: true },
      orderBy: [{ name: 'asc' }],
    });
    res.json(members);
  } catch (error) {
    next(error);
  }
});

app.post('/api/members', async (req, res, next) => {
  try {
    const payload = toMemberPayload(req.body);
    if (!payload.name) return res.status(400).json({ error: 'Member name is required.' });

    const existing = await prisma.member.findUnique({ where: { name: payload.name } });
    const member = existing
      ? await prisma.member.update({
          where: { name: payload.name },
          data: { ...payload, active: true },
        })
      : await prisma.member.create({ data: payload });

    res.json(member);
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
        coverUrl: '',
        totalCopies: 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/books/manual', async (req, res, next) => {
  try {
    const onlyIsbnInput =
      !hasValue(req.body.title) &&
      !hasValue(req.body.author) &&
      !hasValue(req.body.genre) &&
      !hasValue(req.body.condition) &&
      !hasValue(req.body.shelfCode) &&
      !hasValue(req.body.totalCopies) &&
      !hasValue(req.body.availableCopies) &&
      !hasValue(req.body.coverUrl);

    let payload = toBookPayload(req.body);
    if (!payload.isbn || (payload.isbn.length !== 10 && payload.isbn.length !== 13)) {
      return res.status(400).json({ error: 'ISBN must be 10 or 13 characters (digits/X).' });
    }

    const metadata = await fetchBookMetadata(payload.isbn);
    if (metadata) {
      payload = {
        ...payload,
        title: hasValue(req.body.title) ? req.body.title.trim() : metadata.title || payload.title,
        author: hasValue(req.body.author) ? req.body.author.trim() : metadata.author || payload.author,
        genre: hasValue(req.body.genre) ? req.body.genre.trim() : metadata.genre || payload.genre,
        coverUrl: hasValue(req.body.coverUrl) ? req.body.coverUrl.trim() : metadata.coverUrl || payload.coverUrl,
      };
    }

    const existing = await prisma.book.findUnique({ where: { isbn: payload.isbn } });
    let saved;
    if (existing && onlyIsbnInput) {
      saved = await prisma.book.update({
        where: { isbn: payload.isbn },
        data: {
          totalCopies: { increment: 1 },
          availableCopies: { increment: 1 },
          title: payload.title || existing.title,
          author: payload.author || existing.author,
          genre: payload.genre || existing.genre,
          coverUrl: payload.coverUrl || existing.coverUrl,
        },
        include: includeBook,
      });
    } else if (existing) {
      saved = await prisma.book.update({
        where: { isbn: payload.isbn },
        data: {
          ...payload,
          availableCopies: Math.min(payload.availableCopies, payload.totalCopies),
        },
        include: includeBook,
      });
    } else {
      saved = await prisma.book.create({
        data: {
          ...payload,
          availableCopies: Math.min(payload.availableCopies, payload.totalCopies),
        },
        include: includeBook,
      });
    }

    res.json(withActiveCheckout(saved));
  } catch (error) {
    next(error);
  }
});

app.post('/api/books/:id/checkout', async (req, res, next) => {
  try {
    const bookId = Number(req.params.id);
    const memberId = req.body.memberId ? Number(req.body.memberId) : null;
    const providedName = req.body.memberName?.trim();
    const subscriptionPlan = req.body.subscriptionPlan?.trim() || 'Monthly';
    const dueAt = req.body.dueAt ? new Date(req.body.dueAt) : null;
    let memberName = providedName;
    let resolvedPlan = subscriptionPlan;

    if (memberId) {
      const member = await prisma.member.findUnique({ where: { id: memberId } });
      if (!member) return res.status(404).json({ error: 'Selected member was not found.' });
      memberName = member.name;
      resolvedPlan = member.plan || subscriptionPlan;
    }
    if (!memberName) return res.status(400).json({ error: 'Member name is required.' });

    const result = await prisma.$transaction(async (tx) => {
      const book = await tx.book.findUnique({ where: { id: bookId } });
      if (!book) throw new Error('BOOK_NOT_FOUND');
      if (book.availableCopies < 1) throw new Error('NO_COPIES');

      await tx.checkout.create({
        data: {
          bookId,
          memberId,
          memberName,
          subscriptionPlan: resolvedPlan,
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
app.listen(PORT, () => console.log(`Express listening on :${PORT}`));
