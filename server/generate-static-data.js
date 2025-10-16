// 정적 데이터 생성 스크립트
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[FATAL] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 없습니다.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function generatePostsData() {
  try {
    console.log('📝 블로그 포스트 데이터 생성 중...')
    
    const { data, error } = await supabase
      .from('posts')
      .select('data, created_at')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    const posts = (data || []).map(r => r.data)
    
    // 정적 파일로 저장
    const outputPath = path.join(process.cwd(), 'client/public/data/posts.json')
    await fs.writeFile(outputPath, JSON.stringify(posts, null, 2))
    
    console.log(`✅ ${posts.length}개 포스트 데이터 생성 완료: ${outputPath}`)
    return posts.length
  } catch (error) {
    console.error('❌ 블로그 포스트 데이터 생성 실패:', error.message)
    throw error
  }
}

async function generateTierlistData() {
  try {
    console.log('🎯 티어리스트 데이터 생성 중...')
    
    // 포스터 이미지에서 티어 정보 추출
    const POSTER_MODULES = await import('../client/src/pages/Tierlist.tsx').then(m => {
      // 동적으로 import된 모듈에서 POSTER_MODULES 추출
      // 실제로는 파일 시스템에서 직접 읽어야 함
      return {}
    })
    
    // 임시 티어리스트 데이터 구조
    const tierlistData = {
      items: [
        {
          key: "단다단",
          title: "단다단", 
          tier: "S",
          review: "강렬한 여운과 완벽한 서사로 모든 걸 아우른 1황 작품. 작화와 스토리텔링이 완벽하게 어우러진 걸작.",
          comments: []
        },
        {
          key: "봇치",
          title: "봇치 더 로크",
          tier: "A", 
          review: "걸작. 감동을 주는 작품으로 음악과 스토리가 완벽하게 조화를 이룬다.",
          comments: []
        }
      ]
    }
    
    // 정적 파일로 저장
    const outputPath = path.join(process.cwd(), 'client/public/data/tierlist.json')
    await fs.writeFile(outputPath, JSON.stringify(tierlistData, null, 2))
    
    console.log(`✅ 티어리스트 데이터 생성 완료: ${outputPath}`)
    return tierlistData.items.length
  } catch (error) {
    console.error('❌ 티어리스트 데이터 생성 실패:', error.message)
    throw error
  }
}

async function main() {
  try {
    console.log('🚀 정적 데이터 생성 시작...')
    
    const [postsCount, tierlistCount] = await Promise.all([
      generatePostsData(),
      generateTierlistData()
    ])
    
    console.log('🎉 정적 데이터 생성 완료!')
    console.log(`📊 생성된 데이터:`)
    console.log(`   - 블로그 포스트: ${postsCount}개`)
    console.log(`   - 티어리스트 아이템: ${tierlistCount}개`)
    
  } catch (error) {
    console.error('💥 정적 데이터 생성 실패:', error)
    process.exit(1)
  }
}

// 직접 실행 시
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { generatePostsData, generateTierlistData }
