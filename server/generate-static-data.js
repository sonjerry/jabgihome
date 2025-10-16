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
    
    // Supabase에서 티어리스트 관련 데이터 가져오기
    const [titlesResult, reviewsResult, commentsResult] = await Promise.all([
      supabase.from('anime_titles').select('*'),
      supabase.from('threads_reviews').select('*'),
      supabase.from('threads_comments').select('*')
    ])
    
    if (titlesResult.error) throw titlesResult.error
    if (reviewsResult.error) throw reviewsResult.error
    if (commentsResult.error) throw commentsResult.error
    
    const titles = titlesResult.data || []
    const reviews = reviewsResult.data || []
    const comments = commentsResult.data || []
    
    // thread_key를 기준으로 데이터 병합
    const itemsMap = new Map()
    
    // 제목 데이터 추가
    titles.forEach(title => {
      if (!itemsMap.has(title.thread_key)) {
        itemsMap.set(title.thread_key, {
          key: title.thread_key,
          title: title.title,
          tier: 'F', // 기본값
          review: '',
          comments: []
        })
      } else {
        itemsMap.get(title.thread_key).title = title.title
      }
    })
    
    // 리뷰 데이터 추가 (rating을 티어로 변환)
    reviews.forEach(review => {
      if (!itemsMap.has(review.thread_key)) {
        itemsMap.set(review.thread_key, {
          key: review.thread_key,
          title: '',
          tier: 'F',
          review: '',
          comments: []
        })
      }
      const item = itemsMap.get(review.thread_key)
      item.review = review.text || ''
      // rating을 티어로 변환 (0=S, 1=A, 2=B, 3=C, 4=D, 5=F)
      const tierMap = ['S', 'A', 'B', 'C', 'D', 'F']
      item.tier = tierMap[review.rating] || 'F'
    })
    
    // 댓글 데이터 추가
    comments.forEach(comment => {
      if (!itemsMap.has(comment.thread_key)) {
        itemsMap.set(comment.thread_key, {
          key: comment.thread_key,
          title: '',
          tier: 'F',
          review: '',
          comments: []
        })
      }
      itemsMap.get(comment.thread_key).comments.push({
        id: comment.id,
        nickname: comment.nickname,
        content: comment.content,
        createdAt: comment.created_at
      })
    })
    
    const items = Array.from(itemsMap.values())
    const tierlistData = { items }
    
    // 정적 파일로 저장
    const outputPath = path.join(process.cwd(), 'client/public/data/tierlist.json')
    await fs.writeFile(outputPath, JSON.stringify(tierlistData, null, 2))
    
    console.log(`✅ 티어리스트 데이터 생성 완료: ${outputPath}`)
    console.log(`   - ${items.length}개 아이템`)
    console.log(`   - 제목: ${titles.length}개, 리뷰: ${reviews.length}개, 댓글: ${comments.length}개`)
    return items.length
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
