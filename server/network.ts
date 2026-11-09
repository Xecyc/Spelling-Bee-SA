import type { NetworkInterfaceInfo } from 'os';

type Interfaces = Record<string, NetworkInterfaceInfo[] | undefined>;

// Adapters that exist on many Windows/Mac dev machines but are NOT reachable from a phone on the Wi-Fi.
const VIRTUAL_ADAPTER = /(vethernet|virtualbox|vmware|vbox|hyper-v|docker|wsl|loopback|bluetooth|veth|br-|utun|tailscale|zerotier|tap|tun)/i;
const PREFERRED_ADAPTER = /(wi-?fi|wlan|wireless|^en0$|^en1$|ethernet|^eth\d)/i;

function rangeRank(ip: string): number {
  if (ip.startsWith('192.168.')) return 0;
  if (ip.startsWith('10.')) return 1;
  const second = Number(ip.split('.')[1]);
  if (ip.startsWith('172.') && second >= 16 && second <= 31) return 2;
  return 3;
}

/**
 * Orders this machine's IPv4 addresses from "most likely to be the Wi-Fi/LAN address a phone can reach"
 * to "least likely" (virtual adapters last). Link-local and loopback addresses are dropped.
 */
export function rankLanAddresses(interfaces: Interfaces): string[] {
  const candidates: { ip: string; score: number }[] = [];
  for (const [name, list] of Object.entries(interfaces)) {
    for (const info of list ?? []) {
      const family = String(info.family);
      if (!(family === 'IPv4' || family === '4') || info.internal) continue;
      if (info.address.startsWith('169.254.')) continue;
      let score = rangeRank(info.address);
      if (VIRTUAL_ADAPTER.test(name)) score += 100;
      else if (PREFERRED_ADAPTER.test(name)) score -= 10;
      candidates.push({ ip: info.address, score });
    }
  }
  candidates.sort((a, b) => a.score - b.score);
  return [...new Set(candidates.map((c) => c.ip))];
}
