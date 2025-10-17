// Prebuild script: fetch live API and write static JSONs for the client
// Inputs: process.env.VITE_API_URL (e.g., https://your-server)
// Outputs: client/public/data/posts.json, client/public/data/tierlist.json

import fs from 'fs/promises'
import path from 'path'

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const clientRoot = path.resolve(__dirname, '..')
const dataDir = path.join(clientRoot, 'public', 'data')

const API_BASE_RAW = process.env.VITE_API_URL || ''
const API_BASE = API_BASE_RAW.replace(/\/+$/, '')

function apiUrl(p) {
  const clean = p.startsWith('/') ? p : `/${p}`
  return `${API_BASE}/api${clean}`
}

async function safeFetchJson(url, fallback) {
  try {
    const r = await fetch(url, { headers: { 'Accept': 'application/json' } })
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
    return await r.json()
  } catch (e) {
    console.warn(`[build-static-data] fetch failed: ${url} ->`, e?.message || e)
    return fallback
  }
}

async function main() {
  if (!API_BASE) {
    console.warn('[build-static-data] VITE_API_URL not set; writing empty fallbacks')
  }

  await fs.mkdir(dataDir, { recursive: true })

  // posts.json
  const posts = API_BASE ? await safeFetchJson(apiUrl('/posts'), []) : []
  await fs.writeFile(path.join(dataDir, 'posts.json'), JSON.stringify(posts, null, 2))
  console.log(`[build-static-data] wrote posts.json (${Array.isArray(posts) ? posts.length : 0} items)`) 

  // tierlist.json
  const tier = API_BASE ? await safeFetchJson(apiUrl('/tierlist'), { items: [] }) : { items: [] }
  const tierNormalized = tier && typeof tier === 'object' && Array.isArray(tier.items) ? tier : { items: [] }
  await fs.writeFile(path.join(dataDir, 'tierlist.json'), JSON.stringify(tierNormalized, null, 2))
  console.log(`[build-static-data] wrote tierlist.json (${tierNormalized.items.length} items)`) 
}

main().catch((e) => {
  console.error('[build-static-data] fatal:', e)
  process.exit(1)
})


