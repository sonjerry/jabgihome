import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Post, Attachment } from '../types'
import { useI18n } from '../lib/i18n'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getPost, savePost, uploadFile } from '../lib/api'

function uid(){return Math.random().toString(36).slice(2)+Date.now().toString(36)}

export default function Editor(){
  const { t } = useI18n()
  const nav = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [title,setTitle] = useState('')
  const [content,setContent] = useState('')
  const [category,setCategory]=useState('')
  const [tagInput,setTagInput]=useState('')
  const [tags,setTags]=useState<string[]>([])
  const [attachments,setAttachments]=useState<Attachment[]>([])
  const [loading, setLoading] = useState(isEdit)     // ✅ 편집 모드에서만 로딩

  useEffect(()=> {
    if (!isEdit) return
    setLoading(true)
    getPost(id as string)
      .then(p => {
        setTitle(p.title || '')
        setContent(p.content || '')
        setCategory(p.category || '')
        setTags(p.tags || [])
        setAttachments(p.attachments || [])
      })
      .catch(err => {
        console.error(err)
        alert('글을 불러오는 중 오류가 발생했습니다.')
      })
      .finally(()=> setLoading(false))
  }, [id, isEdit])

  const preview = useMemo(()=>content,[content])
  const addTag = ()=>{ const tt = tagInput.trim(); if(tt && !tags.includes(tt)) setTags(v=>[...v,tt]); setTagInput('') }
  const removeTag = (tt:string)=> setTags(v=>v.filter(x=>x!==tt))

  const onFiles = async (files: FileList | null) => {
    if(!files) return
    try{
      const uploaded: Attachment[] = []
      for(const f of Array.from(files)){ uploaded.push(await uploadFile(f)) }
      setAttachments(prev=>[...prev,...uploaded])
    }catch(e){
      console.error(e); alert('파일 업로드에 실패했습니다.')
    }
  }

  const onSave = async () => {
    const now = new Date().toISOString()
    const post: Post = {
      id: isEdit ? (id as string) : uid(),
      title, content, category, tags,
      createdAt: isEdit ? now : now,
      updatedAt: isEdit ? now : undefined,
      comments: [],
      attachments
    }
    try{
      await savePost(post)
      nav('/blog')
    }catch(e){
      console.error(e)
      alert('저장에 실패했습니다.')
    }
  }

  if (loading) return <div className="pt-24 px-6">로딩 중…</div>

  return (
    <div className="pt-24 mx-auto max-w-[1400px] px-3 md:px-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl font-semibold">{isEdit ? t('editPost') : t('newPost')}</h2>
        <div className="flex gap-2">
          <button onClick={onSave} className="glass px-3 py-2 rounded-xl hover:bg-white/10">{t('save')}</button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3 md:gap-4">
        <div className="glass rounded-2xl p-3">
          <input className="w-full bg-transparent text-xl font-semibold mb-2 outline-none"
                 placeholder={t('title')} value={title} onChange={e=>setTitle(e.target.value)} />
          <div className="flex gap-2 mb-2">
            <input className="glass px-3 py-2 rounded-xl bg-white/5" placeholder={t('category')}
                   value={category} onChange={e=>setCategory(e.target.value)} />
            <div className="flex items-center gap-2">
              <input className="glass px-3 py-2 rounded-xl bg-white/5" placeholder={t('tags')}
                     value={tagInput} onChange={e=>setTagInput(e.target.value)}
                     onKeyDown={e=>e.key==='Enter'&&addTag()} />
              <button className="px-3 py-2 rounded-xl hover:bg-white/10" onClick={addTag}>+</button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap mb-2">
            {tags.map(t => (
              <span key={t} className="text-xs px-2 py-1 rounded-full bg-white/10 cursor-pointer"
                    onClick={()=>removeTag(t)}>#{t} ×</span>
            ))}
          </div>

          <textarea className="w-full h-[52vh] md:h-[60vh] bg-transparent outline-none resize-none"
                    placeholder={t('content')} value={content} onChange={e=>setContent(e.target.value)} />

          <div className="mt-3">
            <label className="block text-sm mb-1">첨부 이미지/파일</label>
            <input type="file" multiple onChange={e=>onFiles(e.target.files)} />
            <div className="mt-2 grid grid-cols-3 gap-2">
              {attachments.map(a => (<img key={a.id} src={a.url} alt={a.name} className="rounded-lg" />))}
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-3 prose prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{preview}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
