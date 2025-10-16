// thread_key를 파일명만 사용하도록 마이그레이션
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[FATAL] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 없습니다.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function migrateThreadKeys() {
  try {
    console.log('🔄 thread_key 마이그레이션 시작...')
    
    // 1. anime_titles 테이블 업데이트
    console.log('📝 anime_titles 테이블 업데이트 중...')
    const { data: titles, error: titlesError } = await supabase
      .from('anime_titles')
      .select('thread_key')
      .like('thread_key', 'tier:/assets/%')
    
    if (titlesError) throw titlesError
    
    for (const title of titles || []) {
      const newKey = title.thread_key.replace('tier:/assets/', '')
      const { error } = await supabase
        .from('anime_titles')
        .update({ thread_key: newKey })
        .eq('thread_key', title.thread_key)
      
      if (error) {
        console.error(`❌ anime_titles 업데이트 실패 (${title.thread_key}):`, error.message)
      } else {
        console.log(`✅ anime_titles: ${title.thread_key} → ${newKey}`)
      }
    }
    
    // 2. threads_reviews 테이블 업데이트
    console.log('📝 threads_reviews 테이블 업데이트 중...')
    const { data: reviews, error: reviewsError } = await supabase
      .from('threads_reviews')
      .select('thread_key')
      .like('thread_key', 'tier:/assets/%')
    
    if (reviewsError) throw reviewsError
    
    for (const review of reviews || []) {
      const newKey = review.thread_key.replace('tier:/assets/', '')
      const { error } = await supabase
        .from('threads_reviews')
        .update({ thread_key: newKey })
        .eq('thread_key', review.thread_key)
      
      if (error) {
        console.error(`❌ threads_reviews 업데이트 실패 (${review.thread_key}):`, error.message)
      } else {
        console.log(`✅ threads_reviews: ${review.thread_key} → ${newKey}`)
      }
    }
    
    // 3. threads_comments 테이블 업데이트
    console.log('📝 threads_comments 테이블 업데이트 중...')
    const { data: comments, error: commentsError } = await supabase
      .from('threads_comments')
      .select('thread_key')
      .like('thread_key', 'tier:/assets/%')
    
    if (commentsError) throw commentsError
    
    for (const comment of comments || []) {
      const newKey = comment.thread_key.replace('tier:/assets/', '')
      const { error } = await supabase
        .from('threads_comments')
        .update({ thread_key: newKey })
        .eq('thread_key', comment.thread_key)
      
      if (error) {
        console.error(`❌ threads_comments 업데이트 실패 (${comment.thread_key}):`, error.message)
      } else {
        console.log(`✅ threads_comments: ${comment.thread_key} → ${newKey}`)
      }
    }
    
    console.log('🎉 thread_key 마이그레이션 완료!')
    
  } catch (error) {
    console.error('💥 마이그레이션 실패:', error)
    process.exit(1)
  }
}

// 직접 실행 시
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateThreadKeys()
}
