import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRemoteUrl, resolveRemoteLink, stagePathFor } from './remoteLink.ts';

const loc = (over: Record<string, string>) => ({
  protocol: 'http:', hostname: 'localhost', port: '3000', host: 'localhost:3000', pathname: '/', ...over,
});
const jsonResponse = (body: unknown) =>
  (async () => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } })) as typeof fetch;

test('localhost is replaced by the PC LAN address so the phone can open it', async () => {
  const link = await resolveRemoteLink(loc({}), jsonResponse({ allIps: ['192.168.1.42', '192.168.56.1'], port: 3000 }));
  assert.equal(link.kind, 'ready');
  assert.deepEqual(link.urls, ['http://192.168.1.42:3000/?view=remote', 'http://192.168.56.1:3000/?view=remote']);
});

test('uses the port the page is really served on (e.g. a custom PORT)', async () => {
  const link = await resolveRemoteLink(loc({ port: '4123', host: 'localhost:4123' }), jsonResponse({ allIps: ['10.0.0.7'], port: 3000 }));
  assert.equal(link.urls[0], 'http://10.0.0.7:4123/?view=remote');
});

test('opened through the LAN address already: keep it', async () => {
  const link = await resolveRemoteLink(
    loc({ hostname: '192.168.1.42', host: '192.168.1.42:3000' }),
    jsonResponse({ allIps: ['192.168.1.42'], port: 3000 })
  );
  assert.equal(link.kind, 'ready');
  assert.deepEqual(link.urls, ['http://192.168.1.42:3000/?view=remote']);
});

test('GitHub Pages has no server behind it: reported as static, not as working', async () => {
  const notFound = (async () => new Response('<html>404</html>', { status: 404, headers: { 'content-type': 'text/html' } })) as typeof fetch;
  const link = await resolveRemoteLink(
    loc({ protocol: 'https:', hostname: 'xecyc.github.io', host: 'xecyc.github.io', port: '', pathname: '/Spelling-Bee-SA/' }),
    notFound
  );
  assert.equal(link.kind, 'static');
  assert.deepEqual(link.urls, ['https://xecyc.github.io/Spelling-Bee-SA/?view=remote']);
});

test('a static host that answers every path with index.html (HTML 200) is still detected as static', async () => {
  const spaFallback = (async () => new Response('<html></html>', { headers: { 'content-type': 'text/html' } })) as typeof fetch;
  const link = await resolveRemoteLink(loc({ hostname: 'example.org', host: 'example.org', port: '' }), spaFallback);
  assert.equal(link.kind, 'static');
});

test('server found but the PC has no network address', async () => {
  const link = await resolveRemoteLink(loc({}), jsonResponse({ allIps: [], port: 3000 }));
  assert.equal(link.kind, 'no-network');
});

test('server unreachable on localhost counts as static/no server', async () => {
  const boom = (async () => { throw new Error('offline'); }) as typeof fetch;
  assert.equal((await resolveRemoteLink(loc({}), boom)).kind, 'static');
});

test('stage path strips /remote variants and keeps sub-folders', () => {
  assert.equal(stagePathFor('/'), '/');
  assert.equal(stagePathFor('/remote'), '/');
  assert.equal(stagePathFor('/Spelling-Bee-SA/remote/index.html'), '/Spelling-Bee-SA/');
  assert.equal(stagePathFor('/Spelling-Bee-SA/'), '/Spelling-Bee-SA/');
  assert.equal(buildRemoteUrl('https:', 'x.io', '/app/remote'), 'https://x.io/app/?view=remote');
});
