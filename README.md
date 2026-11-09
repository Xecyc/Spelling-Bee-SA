# Spelling Bee 2026 – Stage Deck & Phone Remote

Interactive presentation for the U.E.P. Salto Ángel Spelling Bee: welcome slide, physics-based **wheel of words** with a countdown timer, and a **winner podium**. A phone works as a remote control for the stage screen.

## Run it (stage PC)

```bash
npm install
npm run dev          # development, http://localhost:3000
# or, for the event:
npm run build && npm start
```

Optional: copy `.env.example` to `.env` and set `GEMINI_API_KEY` to enable the Word/Excel → wheel importer.

## Phone remote

The remote only works while the app runs **on the stage PC** (it needs the small server in `server.ts`).
GitHub Pages is static hosting, so there it can't connect two devices.

1. Start the app on the stage PC and open it in the browser there (keep that tab open).
2. Open the **Stage Remote** window (QR code). The code contains the PC's Wi-Fi address, not `localhost`.
3. Scan it with the phone. The phone must be on the **same Wi-Fi** as the PC.
   On Windows, allow Node.js through the firewall on **Private networks** when asked.

The phone shows a green dot when everything is connected, an amber banner if no stage screen is open,
and a red banner if the PC can't be reached. Every tap shows whether it was delivered.

Controls: Spin wheel · Stop spin · Start / Stop / Reset timer · Remove word · Close · Podium (names → *Push to Stage*) · Clear board.

### How it works

`phone → server (Socket.IO, HTTP fallback) → stage`. Each command has a unique id, so a tap runs exactly once even if
it travels over two transports or is retried. Code: `src/utils/remoteClient.ts` (browser), `server/remoteServer.ts` + `server/relay.ts` (server), `src/utils/remoteProtocol.ts` (shared).

## Scripts

| | |
|---|---|
| `npm run dev` | dev server (Vite + relay) |
| `npm start` | production server (run `npm run build` first) |
| `npm run lint` | TypeScript type-check |
| `npm test` | unit + real-server integration tests |
| `npm run e2e` | browser end-to-end test (phone + PC); see header of `e2e/remote.e2e.mjs` |

Set `PORT` to use a port other than 3000.
