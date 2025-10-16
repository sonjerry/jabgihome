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
    
    // 정적 파일로 저장 (스크립트 파일 기준으로 경로 계산)
    const serverDir = path.dirname(new URL(import.meta.url).pathname)
    const repoRoot = path.resolve(serverDir, '..')
    const dataDir = path.join(repoRoot, 'client', 'public', 'data')
    await fs.mkdir(dataDir, { recursive: true })
    const outputPath = path.join(dataDir, 'posts.json')
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
    
    console.log('📊 Supabase 쿼리 결과:')
    console.log('  - anime_titles:', titlesResult.data?.length || 0, '개')
    console.log('  - threads_reviews:', reviewsResult.data?.length || 0, '개')
    console.log('  - threads_comments:', commentsResult.data?.length || 0, '개')
    
    if (titlesResult.error) {
      console.error('❌ anime_titles 에러:', titlesResult.error)
      throw titlesResult.error
    }
    if (reviewsResult.error) {
      console.error('❌ threads_reviews 에러:', reviewsResult.error)
      throw reviewsResult.error
    }
    if (commentsResult.error) {
      console.error('❌ threads_comments 에러:', commentsResult.error)
      throw commentsResult.error
    }
    
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
    
    // 리뷰 데이터 추가 (rating 제거; 텍스트만 사용)
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
      // rating 값은 더 이상 사용하지 않음
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
    
    // 정적 파일로 저장 (스크립트 파일 기준으로 경로 계산)
    const serverDir = path.dirname(new URL(import.meta.url).pathname)
    const repoRoot = path.resolve(serverDir, '..')
    const dataDir = path.join(repoRoot, 'client', 'public', 'data')
    await fs.mkdir(dataDir, { recursive: true })
    const outputPath = path.join(dataDir, 'tierlist.json')
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

// thread_key를 파일명으로 하는 개별 정적 파일 생성
async function generateIndividualThreadFiles() {
  try {
    console.log('📁 개별 스레드 파일 생성 중...')
    
    // 모든 thread_key 수집
    const [titlesResult, reviewsResult, commentsResult] = await Promise.all([
      supabase.from('anime_titles').select('thread_key'),
      supabase.from('threads_reviews').select('thread_key'),
      supabase.from('threads_comments').select('thread_key')
    ])
    
    const allKeys = new Set()
    if (titlesResult.data) titlesResult.data.forEach(t => allKeys.add(t.thread_key))
    if (reviewsResult.data) reviewsResult.data.forEach(r => allKeys.add(r.thread_key))
    if (commentsResult.data) commentsResult.data.forEach(c => allKeys.add(c.thread_key))
    
    console.log(`📊 총 ${allKeys.size}개의 thread_key 발견`)
    
    const serverDir = path.dirname(new URL(import.meta.url).pathname)
    const repoRoot = path.resolve(serverDir, '..')
    const threadsDir = path.join(repoRoot, 'client', 'public', 'threads')
    await fs.mkdir(threadsDir, { recursive: true })
    
    let generatedCount = 0
    
    // 각 thread_key에 대해 개별 파일 생성
    for (const threadKey of allKeys) {
      try {
        // 해당 thread_key의 모든 데이터 가져오기
        const [titleList, reviewList, commentsResult] = await Promise.all([
          supabase.from('anime_titles').select('*').eq('thread_key', threadKey).limit(1),
          supabase.from('threads_reviews').select('*').eq('thread_key', threadKey).limit(1),
          supabase.from('threads_comments').select('*').eq('thread_key', threadKey)
        ])
        
        const threadData = {
          key: threadKey,
          title: (Array.isArray(titleList.data) ? titleList.data[0]?.title : titleList.data?.title) || '',
          tier: 'F',
          review: '',
          comments: []
        }
        
        // 리뷰 데이터 처리
        const reviewRow = Array.isArray(reviewList.data) ? reviewList.data[0] : reviewList.data
        if (reviewRow) {
          threadData.review = reviewRow.text || ''
          const tierMap = ['S', 'A', 'B', 'C', 'D', 'F']
          threadData.tier = tierMap[reviewRow.rating] || 'F'
        }
        
        // 댓글 데이터 처리
        if (commentsResult.data) {
          threadData.comments = commentsResult.data.map(comment => ({
            id: comment.id,
            nickname: comment.nickname,
            content: comment.content,
            createdAt: comment.created_at
          }))
        }
        
        // 파일명으로 안전한 이름 생성 (특수문자 제거)
        const safeFileName = threadKey.replace(/[^a-zA-Z0-9._-]/g, '_') + '.json'
        const filePath = path.join(threadsDir, safeFileName)
        
        await fs.writeFile(filePath, JSON.stringify(threadData, null, 2))
        generatedCount++
        
      } catch (error) {
        console.error(`❌ ${threadKey} 파일 생성 실패:`, error.message)
      }
    }
    
    console.log(`✅ ${generatedCount}개 개별 스레드 파일 생성 완료: ${threadsDir}`)
    return generatedCount
    
  } catch (error) {
    console.error('❌ 개별 스레드 파일 생성 실패:', error.message)
    throw error
  }
}

async function main() {
  try {
    console.log('🚀 정적 데이터 생성 시작...')
    console.log('현재 작업 디렉토리:', process.cwd())
    const serverDir = path.dirname(new URL(import.meta.url).pathname)
    const repoRoot = path.resolve(serverDir, '..')
    console.log('해석된 repoRoot:', repoRoot)
    
    const [postsCount, tierlistCount, threadFilesCount] = await Promise.all([
      generatePostsData(),
      generateTierlistData(),
      generateIndividualThreadFiles()
    ])
    
    console.log('🎉 정적 데이터 생성 완료!')
    console.log(`📊 생성된 데이터:`)
    console.log(`   - 블로그 포스트: ${postsCount}개`)
    console.log(`   - 티어리스트 아이템: ${tierlistCount}개`)
    console.log(`   - 개별 스레드 파일: ${threadFilesCount}개`)
    
  } catch (error) {
    console.error('💥 정적 데이터 생성 실패:', error)
    process.exit(1)
  }
}

// 직접 실행 시
if (import.meta.url.endsWith('generate-static-data.js')) {
  console.log('스크립트 직접 실행됨')
  main()
}

export { generatePostsData, generateTierlistData, generateIndividualThreadFiles }
