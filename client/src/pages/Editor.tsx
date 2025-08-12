// client/src/pages/Editor.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Post, Attachment } from '../types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getPost, savePost, uploadFile } from '../lib/api'
import PageShell from '../components/PageShell'

function uid(){return Math.random().toString(36).slice(2)+Date.now().toString(36)}

export default function Editor(){
  const nav = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [title,setTitle] = useState('')
  const [content,setContent] = useState('')
  const [category,setCategory]=useState('')
  const [tagInput,setTagInput]=useState('')
  const [tags,setTags]=useState<string[]>([])
  const [attachments,setAttachments]=useState<Attachment[]>([])
  const [loading, setLoading] = useState(isEdit)

  const textareaRef = useRef<HTMLTextAreaElement|null>(null)

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

  const insertMarkdown = (md: string) => {
    const el = textareaRef.current
    if (!el) { setContent(c => (c ? (c + '\n' + md) : md)); return }
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const next = el.value.slice(0, start) + md + el.value.slice(end)
    setContent(next)
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + md.length
      el.focus()
    })
  }

  const onFiles = async (files: FileList | null) => {
    if(!files) return
    try{
      const uploaded: Attachment[] = []
      for (const f of Array.from(files)) {
        const att = await uploadFile(f)
        uploaded.push(att)
        if ((att.type || '').startsWith('image/')) {
          const alt = att.name || 'image'
          insertMarkdown(`\n\n![${alt}](${att.url})\n\n`)
        }
      }
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
      createdAt: now,
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
    <PageShell>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl md:text-3xl font-semibold">{isEdit ? '글 수정' : '새 글 작성'}</h2>
        <div className="flex gap-2">
          <button onClick={onSave} className="glass px-3 py-2 rounded-xl hover:bg-white/10">저장</button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* 에디터 */}
        <div className="glass rounded-2xl p-3">
          <input
            className="w-full bg-transparent text-xl md:text-2xl font-semibold mb-3 outline-none"
            placeholder="제목" value={title} onChange={e=>setTitle(e.target.value)} />

          <div className="flex flex-wrap gap-2 mb-3">
            <input className="glass px-3 py-2 rounded-xl bg-white/5" placeholder="카테고리"
                   value={category} onChange={e=>setCategory(e.target.value)} />
            <div className="flex items-center gap-2">
              <input className="glass px-3 py-2 rounded-xl bg-white/5" placeholder="태그"
                     value={tagInput} onChange={e=>setTagInput(e.target.value)}
                     onKeyDown={e=>e.key==='Enter'&&addTag()} />
              <button className="px-3 py-2 rounded-xl hover:bg-white/10" onClick={addTag}>+</button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {tags.map(t => (
                <span key={t} className="text-xs px-2 py-1 rounded-full bg-white/10 cursor-pointer"
                      onClick={()=>removeTag(t)}>#{t} ×</span>
              ))}
            </div>
          </div>

          <textarea
            ref={textareaRef}
            className="w-full h-[52vh] md:h-[60vh] bg-transparent outline-none resize-none leading-relaxed"
            placeholder="본문 내용을 입력하세요"
            value={content}
            onChange={e=>setContent(e.target.value)}
          />

          {/* 첨부 */}
          <div className="mt-3">
            <label className="block text-sm mb-1">첨부 이미지/파일</label>
            <input type="file" multiple onChange={e=>onFiles(e.target.files)} />
            <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-2">
              {attachments.map(a => {
                const isImg = (a.type || '').startsWith('image/')
                return (
                  <div key={a.id} className="group relative rounded-lg overflow-hidden">
                    {isImg ? (
                      <img src={a.url} alt={a.name || 'attachment'} className="block w-full h-24 object-cover" />
                    ) : (
                      <a href={a.url} target="_blank" rel="noreferrer" className="text-xs underline break-all">{a.name || a.url}</a>
                    )}
                    {isImg && (
                      <button
                        type="button"
                        onClick={() => insertMarkdown(`\n\n![${a.name || 'image'}](${a.url})\n\n`)}
                        className="absolute right-1.5 bottom-1.5 text-[10px] px-2 py-1 rounded bg-black/60 hover:bg-black/80"
                        title="본문에 이미지 마크다운 삽입"
                      >
                        본문에 추가
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 미리보기 */}
        <div className="glass rounded-2xl p-3 prose prose-invert max-w-none post-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({src, alt}) => (
                <img src={src || ''} alt={alt || ''} loading="lazy"
                     className="rounded-xl w-full h-auto max-h-[70vh] object-contain my-4" />
              ),
              a: ({href, children}) => (
                <a href={href} target="_blank" rel="noreferrer" className="underline decoration-dotted">{children}</a>
              ),
            }}
          >
            {preview}
          </ReactMarkdown>
        </div>
      </div>
    </PageShell>
  )
}
