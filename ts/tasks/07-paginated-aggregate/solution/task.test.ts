import { AddressInfo } from 'node:net';
import { Server, createServer } from 'node:http';
import { Order, toCents, totalPaidCents } from './task';

const PER_PAGE = 3;

const ORDERS: Order[] = [
  { id: 1, customer: 'Acme Corp', amount: '10.10', status: 'paid' },
  { id: 2, customer: 'Acme Corp', amount: '0.20', status: 'paid' },
  { id: 3, customer: 'Acme Corp', amount: '99.99', status: 'refunded' },
  { id: 4, customer: 'Acme Corp', amount: '5', status: 'paid' },
  { id: 5, customer: 'Acme Corp', amount: '1.5', status: 'pending' },
  { id: 6, customer: 'Acme Corp', amount: '0.70', status: 'paid' },
  { id: 7, customer: 'Acme Corp', amount: '1000.00', status: 'paid' },
  { id: 8, customer: 'Globex', amount: '7.00', status: 'paid' },
  { id: 9, customer: 'R&D Ltd', amount: '3.33', status: 'paid' },
];

let server: Server;
let baseUrl: string;
const requested: string[] = [];
let failPage: number | null = null;

beforeAll(async () => {
  server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    requested.push(url.pathname + url.search);
    if (url.pathname !== '/api/orders') {
      res.writeHead(404).end();
      return;
    }
    const customer = url.searchParams.get('customer');
    const page = Number(url.searchParams.get('page') ?? '1');
    if (failPage === page) {
      res.writeHead(503, { 'content-type': 'application/json' }).end('{"error":"busy"}');
      return;
    }
    const all = ORDERS.filter((o) => o.customer === customer);
    const totalPages = Math.ceil(all.length / PER_PAGE);
    const body = {
      page,
      per_page: PER_PAGE,
      total: all.length,
      total_pages: totalPages,
      data: all.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    };
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(body));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  requested.length = 0;
  failPage = null;
});

describe('toCents', () => {
  it.each([
    ['10.10', 1010],
    ['0.20', 20],
    ['5', 500],
    ['1.5', 150],
    ['1000.00', 100000],
    ['-2.05', -205],
  ])('%s → %d', (input, cents) => {
    expect(toCents(input)).toBe(cents);
  });

  it('rejects garbage', () => {
    expect(() => toCents('abc')).toThrow();
    expect(() => toCents('1.234')).toThrow();
  });
});

describe('totalPaidCents', () => {
  it('sums paid orders across ALL pages (in cents, no float drift)', async () => {
    // 10.10 + 0.20 + 5 + 0.70 + 1000.00 = 1016.00
    await expect(totalPaidCents(baseUrl, 'Acme Corp')).resolves.toBe(101600);
    const pages = requested.map((r) => new URL(r, baseUrl).searchParams.get('page'));
    expect(pages).toEqual(['1', '2', '3']);
  });

  it('single page', async () => {
    await expect(totalPaidCents(baseUrl, 'Globex')).resolves.toBe(700);
    expect(requested).toHaveLength(1);
  });

  it('total_pages: 0 → 0 with exactly one request (no infinite loop)', async () => {
    await expect(totalPaidCents(baseUrl, 'Nobody')).resolves.toBe(0);
    expect(requested).toHaveLength(1);
  });

  it('encodes the customer name in the query string', async () => {
    await expect(totalPaidCents(baseUrl, 'R&D Ltd')).resolves.toBe(333);
  });

  it('non-2xx response rejects (fetch does not throw on 503 by itself)', async () => {
    failPage = 2;
    await expect(totalPaidCents(baseUrl, 'Acme Corp')).rejects.toThrow(/503/);
  });

  it('network error rejects', async () => {
    await expect(totalPaidCents('http://127.0.0.1:1', 'Acme Corp')).rejects.toThrow();
  });
});
