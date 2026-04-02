/**
 * Via Browser Telemetry
 *
 * Captures errors, network activity, navigation, and interactions
 * and flushes them to the sandbox Express backend so the agent
 * can observe what happens at runtime.
 */

const ENDPOINT = '/api/__via/telemetry';
const FLUSH_INTERVAL_MS = 3000;

let initialized = false;
let buffer = [];
let flushTimer = null;
const originalFetch = window.fetch.bind(window);
const originalConsoleError = console.error.bind(console);
const originalConsoleWarn = console.warn.bind(console);

function push(event) {
  buffer.push({ ts: Date.now(), ...event });
}

function flush() {
  if (buffer.length === 0) return;
  const events = buffer;
  buffer = [];
  try {
    originalFetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(events),
    }).catch(() => {});
  } catch (_) {
    // silently drop
  }
}

function flushNow() {
  try { flush(); } catch (_) {}
}

export function initTelemetry() {
  if (initialized) return;
  initialized = true;

  try {
    // --- Tier 1: Errors ---

    window.onerror = function (message, source, lineno, colno, error) {
      try {
        push({ type: 'error', message: String(message), source, lineno, colno, stack: error?.stack });
        flushNow();
      } catch (_) {}
    };

    window.onunhandledrejection = function (event) {
      try {
        const reason = event.reason;
        push({ type: 'error', message: String(reason), stack: reason?.stack });
        flushNow();
      } catch (_) {}
    };

    // Intercept console.error / console.warn
    console.error = function (...args) {
      try { push({ type: 'console', level: 'error', message: args.map(String).join(' ') }); } catch (_) {}
      return originalConsoleError(...args);
    };

    console.warn = function (...args) {
      try { push({ type: 'console', level: 'warn', message: args.map(String).join(' ') }); } catch (_) {}
      return originalConsoleWarn(...args);
    };

    // --- Tier 1 + Tier 2: Monkey-patch fetch ---

    window.fetch = function (input, init) {
      const method = (init?.method || 'GET').toUpperCase();
      const url = typeof input === 'string' ? input : input?.url || String(input);
      // Skip our own telemetry calls
      if (url === ENDPOINT) return originalFetch(input, init);
      const start = Date.now();
      return originalFetch(input, init).then(
        (response) => {
          try {
            const duration = Date.now() - start;
            push({ type: 'network', method, url, status: response.status, duration });
            if (response.status >= 400) {
              push({ type: 'error', message: `fetch ${method} ${url} returned ${response.status}` });
              flushNow();
            }
          } catch (_) {}
          return response;
        },
        (err) => {
          try {
            const duration = Date.now() - start;
            push({ type: 'error', message: `fetch ${method} ${url} network error: ${err?.message}` });
            push({ type: 'network', method, url, status: 0, duration, error: err?.message });
            flushNow();
          } catch (_) {}
          throw err;
        }
      );
    };

    // --- Tier 2: Navigation ---

    window.addEventListener('popstate', () => {
      try { push({ type: 'navigation', url: location.href }); } catch (_) {}
    });

    // --- Tier 3: Interactions ---

    document.addEventListener('click', (e) => {
      try {
        const target = e.target.closest('button, a, [role="button"]');
        if (!target) return;
        const selector = target.tagName.toLowerCase()
          + (target.id ? `#${target.id}` : '')
          + (target.className && typeof target.className === 'string'
              ? '.' + target.className.trim().split(/\s+/).join('.')
              : '');
        push({ type: 'click', selector, text: (target.textContent || '').slice(0, 120).trim() });
      } catch (_) {}
    }, true);

    // --- Flush loop ---

    flushTimer = setInterval(flush, FLUSH_INTERVAL_MS);
    window.addEventListener('beforeunload', flushNow);
  } catch (_) {
    // Telemetry must never break the app
  }
}
