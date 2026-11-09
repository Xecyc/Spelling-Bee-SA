import test from 'node:test';
import assert from 'node:assert/strict';
import { rankLanAddresses } from './network.ts';

const v4 = (address: string, internal = false) =>
  ({ address, family: 'IPv4', internal, netmask: '255.255.255.0', mac: '', cidr: null }) as any;

test('prefers the Wi-Fi address over virtual adapters (WSL / VirtualBox / Docker)', () => {
  const ips = rankLanAddresses({
    'vEthernet (WSL)': [v4('172.28.64.1')],
    'VirtualBox Host-Only Network': [v4('192.168.56.1')],
    'Wi-Fi': [v4('192.168.1.42')],
    'docker0': [v4('172.17.0.1')],
    Loopback: [v4('127.0.0.1', true)],
  });
  assert.equal(ips[0], '192.168.1.42');
  assert.equal(ips.length, 4);
  assert.ok(!ips.includes('127.0.0.1'));
});

test('ignores link-local and IPv6, and de-duplicates', () => {
  const ips = rankLanAddresses({
    Ethernet: [v4('169.254.10.10'), v4('10.0.0.5'), { ...v4('fe80::1'), family: 'IPv6' }],
    Ethernet2: [v4('10.0.0.5')],
  });
  assert.deepEqual(ips, ['10.0.0.5']);
});

test('ranks private ranges 192.168 > 10 > 172.16/12 when adapter names are unhelpful', () => {
  const ips = rankLanAddresses({ a: [v4('172.20.0.2')], b: [v4('10.1.1.1')], c: [v4('192.168.0.9')] });
  assert.deepEqual(ips, ['192.168.0.9', '10.1.1.1', '172.20.0.2']);
});

test('returns an empty list when the machine is offline', () => {
  assert.deepEqual(rankLanAddresses({ lo: [v4('127.0.0.1', true)] }), []);
});
