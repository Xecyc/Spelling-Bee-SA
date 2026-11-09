/**
 * Works out the address the PHONE must open. "localhost" is useless on a phone: it means the phone itself.
 */
export type RemoteLinkKind =
  | 'ready' //    server found, address is reachable from other devices
  | 'no-network' // opened via localhost but the server found no Wi-Fi/LAN address
  | 'static'; //   no stage server behind this page (e.g. GitHub Pages): cross-device control is impossible

export interface RemoteLink {
  kind: RemoteLinkKind;
  /** Best guess first. More than one when the PC has several network adapters. */
  urls: string[];
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1', '0.0.0.0']);

export const isLocalHostName = (hostname: string): boolean => LOCAL_HOSTS.has(hostname.toLowerCase());

/** Path of the stage page without any trailing /remote, always ending in "/". */
export function stagePathFor(pathname: string): string {
  const cleaned = pathname.replace(/\/remote(\/index\.html|\.html)?\/?$/, '').replace(/\/index\.html$/, '');
  return cleaned.endsWith('/') ? cleaned : `${cleaned}/`;
}

export function buildRemoteUrl(protocol: string, host: string, pathname: string): string {
  return `${protocol}//${host}${stagePathFor(pathname)}?view=remote`;
}

interface NetworkInfo {
  allIps?: string[];
  port?: number;
}

export async function resolveRemoteLink(
  location: Pick<Location, 'protocol' | 'hostname' | 'port' | 'host' | 'pathname'>,
  fetchImpl: typeof fetch = (input, init) => fetch(input, init)
): Promise<RemoteLink> {
  let network: NetworkInfo | null = null;
  try {
    const res = await fetchImpl('/api/network-ip', { cache: 'no-store' });
    const type = res.headers.get('content-type') ?? '';
    // A static host answers every path with index.html or a 404 page, never JSON.
    if (res.ok && type.includes('json')) network = (await res.json()) as NetworkInfo;
  } catch {
    network = null;
  }

  if (isLocalHostName(location.hostname)) {
    const ips = network?.allIps ?? [];
    if (!network || ips.length === 0) {
      return {
        kind: network ? 'no-network' : 'static',
        urls: [buildRemoteUrl(location.protocol, location.host, location.pathname)],
      };
    }
    const port = location.port || String(network.port ?? '');
    return {
      kind: 'ready',
      urls: ips.map((ip) => buildRemoteUrl(location.protocol, port ? `${ip}:${port}` : ip, location.pathname)),
    };
  }

  // Already opened through a real address (LAN IP or public host).
  return {
    kind: network ? 'ready' : 'static',
    urls: [buildRemoteUrl(location.protocol, location.host, location.pathname)],
  };
}
