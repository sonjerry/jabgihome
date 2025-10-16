// 티어리스트 데이터만 테스트
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

async function testTierlistData() {
  try {
    console.log('🎯 티어리스트 데이터 테스트 중...')
    
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
    
    // 샘플 데이터 출력
    if (titles.length > 0) {
      console.log('📝 샘플 anime_titles:', titles[0])
    }
    if (reviews.length > 0) {
      console.log('📝 샘플 threads_reviews:', reviews[0])
    }
    if (comments.length > 0) {
      console.log('📝 샘플 threads_comments:', comments[0])
    }
    
    console.log('✅ 테스트 완료!')
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error)
  }
}

testTierlistData()
