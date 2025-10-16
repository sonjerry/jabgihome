// client/src/pages/Editor.tsx
import { useEffect, useRef, useState, useMemo, Component, ReactNode } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import type { Post, Attachment } from '../types'
import { getPost, savePost, uploadFile, updatePost } from '../lib/api'
import PageShell from '../components/PageShell'

// 간단한 ErrorBoundary 컴포넌트
class EditorErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('에디터 에러:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

function uid(){return Math.random().toString(36).slice(2)+Date.now().toString(36)}

export default function Editor(){
  const nav = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [title,setTitle] = useState('')
  const [content,setContent] = useState('')
  const [category,setCategory]=useState('')
  const [tagInput,setTagInput]=useState('')
  const [tags,setTags]=useState<string[]>([])
  const [attachments,setAttachments]=useState<Attachment[]>([])
  const [createdAt, setCreatedAt] = useState<string>('')
  const [loading, setLoading] = useState(isEdit)
  const [styleTextColor, setStyleTextColor] = useState<string>('#e5e7eb')
  const [styleFontSize, setStyleFontSize] = useState<number>(16)
  const [helpOpen, setHelpOpen] = useState<boolean>(false)
  const [editorReady, setEditorReady] = useState<boolean>(false)
  const [editorError, setEditorError] = useState<string | null>(null)
  const [tipTapLoaded, setTipTapLoaded] = useState<boolean>(false)
  const [tipTapModules, setTipTapModules] = useState<any>(null)
  const [editorInstance, setEditorInstance] = useState<any>(null)

  const textareaRef = useRef<HTMLTextAreaElement|null>(null)
  const editorRef = useRef<any>(null)

  // TipTap 동적 로드
  useEffect(() => {
    const loadTipTap = async () => {
      console.log('TipTap 모듈 로드 시작...')
      try {
        const [
          { EditorContent, Editor },
          StarterKit,
          TextStyle,
          Color,
          Link,
          Image,
          TextAlign
        ] = await Promise.all([
          import('@tiptap/react'),
          import('@tiptap/starter-kit'),
          import('@tiptap/extension-text-style'),
          import('@tiptap/extension-color'),
          import('@tiptap/extension-link'),
          import('@tiptap/extension-image'),
          import('@tiptap/extension-text-align')
        ])

        console.log('TipTap 모듈 로드 성공:', { EditorContent, Editor, StarterKit })

        setTipTapModules({
          EditorContent,
          Editor,
          StarterKit,
          TextStyle,
          Color,
          Link,
          Image,
          TextAlign
        })
        setTipTapLoaded(true)
        console.log('TipTap 상태 업데이트 완료')
      } catch (error) {
        console.error('TipTap 모듈 로드 실패:', error)
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined
        })
        setEditorError(error instanceof Error ? error.message : 'TipTap 모듈을 로드할 수 없습니다.')
      }
    }

    loadTipTap()
  }, [])

  // 에디터 인스턴스 생성
  useEffect(() => {
    if (!tipTapModules || editorInstance) return

    const createEditor = () => {
      try {
        console.log('TipTap 에디터 인스턴스 생성 시작...')
        const { Editor, StarterKit, TextStyle, Color, Link, Image, TextAlign } = tipTapModules
        
        const extensions = [
          StarterKit.default || StarterKit,
          TextStyle.default || TextStyle,
          Color.default || Color,
          Link.default.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer' } }),
          Image.default.configure({ inline: false, allowBase64: true }),
          TextAlign.default.configure({ types: ['heading','paragraph'] })
        ]
        
        const editor = new Editor({
          extensions,
          content: content || '<p></p>',
          onUpdate: ({ editor }: any) => {
            const newContent = editor.getHTML()
            console.log('에디터 업데이트:', newContent.substring(0, 100))
            // content가 실제로 변경되었을 때만 상태 업데이트
            if (newContent !== content) {
              setContent(newContent)
            }
            setEditorReady(true)
          },
          onCreate: ({ editor }: any) => {
            console.log('에디터 생성 완료')
            editorRef.current = editor
            setEditorReady(true)
            setEditorError(null)
          },
        })
        
        setEditorInstance(editor)
        console.log('TipTap 에디터 인스턴스 생성 성공')
      } catch (error) {
        console.error('TipTap 에디터 인스턴스 생성 실패:', error)
        setEditorError(error instanceof Error ? error.message : '알 수 없는 오류')
      }
    }

    createEditor()
  }, [tipTapModules])

  // content 변경 시 에디터 내용 업데이트 (에디터가 외부에서 content를 변경받을 때)
  useEffect(() => {
    if (editorInstance && content && editorInstance.getHTML() !== content) {
      console.log('에디터 내용 외부 업데이트:', content.substring(0, 100))
      editorInstance.commands.setContent(content)
    }
  }, [content, editorInstance])

  // 컴포넌트 언마운트 시 에디터 정리
  useEffect(() => {
    return () => {
      if (editorInstance) {
        console.log('에디터 인스턴스 정리')
        editorInstance.destroy()
      }
    }
  }, [editorInstance])

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
        setCreatedAt(p.createdAt || '')
        setStyleTextColor(p.style?.textColor || '#e5e7eb')
        setStyleFontSize(p.style?.fontSize || 16)
      })
      .catch(err => {
        console.error(err)
        alert('글을 불러오는 중 오류가 발생했습니다.')
      })
      .finally(()=> setLoading(false))
  }, [id, isEdit])

  // TipTap: 정적 임포트 사용으로 별도 동적 로드 없음
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

  const wrapSelection = (prefix: string, suffix: string = '') => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart ?? 0
    const end = el.selectionEnd ?? 0
    const before = el.value.slice(0, start)
    const selected = el.value.slice(start, end)
    const after = el.value.slice(end)
    const wrapped = `${before}${prefix}${selected}${suffix || ''}${suffix ? '' : ''}`
    setContent(wrapped + after)
    requestAnimationFrame(() => {
      const pos = (before + prefix + selected + (suffix || '')).length
      el.selectionStart = el.selectionEnd = pos
      el.focus()
    })
  }

  const applyInlineSize = (px: number) => {
    if (!editorRef.current) return
    editorRef.current.chain().focus().setMark('textStyle', { fontSize: `${px}px` }).run()
  }
  const applyInlineColor = (color: string) => {
    if (!editorRef.current) return
    editorRef.current.chain().focus().setColor(color).run()
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
          if (editorRef.current) {
            editorRef.current.chain().focus().setImage({ src: att.url, alt }).run()
          } else {
            insertMarkdown(`\n\n![${alt}](${att.url})\n\n`)
          }
        }
      }
      setAttachments(prev=>[...prev,...uploaded])
    }catch(e){
      console.error(e); alert('파일 업로드에 실패했습니다.')
    }
  }

  const onSave = async () => {
    const now = new Date().toISOString()
    const normalizedCategory = (category || '').trim()
    const post: Post = {
      id: isEdit ? (id as string) : uid(),
      title,
      content: editorRef.current ? editorRef.current.getHTML() : content,
      category: normalizedCategory, tags,
      createdAt: isEdit ? (createdAt || now) : now,
      updatedAt: isEdit ? now : undefined,
      attachments,
      style: { textColor: styleTextColor, fontSize: styleFontSize }
    }
    try{
      if (isEdit) {
        await updatePost(post)
      } else {
        await savePost(post)
      }
      
      // URL 파라미터를 확인해서 프로젝트 진행사항에서 온 경우 해당 페이지로 돌아가기
      const searchParams = new URLSearchParams(location.search)
      const progress = searchParams.get('progress')
      if (progress) {
        nav(`/blog?progress=${encodeURIComponent(progress)}`)
      } else {
        nav('/blog')
      }
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

      <div className="grid grid-cols-1 gap-4">
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

          {/* 인라인 스타일 도구 (에디터가 준비된 경우에만 표시) */}
          {editorReady && !editorError && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="flex items-center gap-2 glass rounded-xl px-2 py-1">
                <span className="text-xs opacity-80">크기</span>
                {[14,16,18,20,22,24,28,32].map(s => (
                  <button key={s} type="button" onClick={() => applyInlineSize(s)} className="text-xs px-2 py-1 rounded hover:bg-white/10">{s}</button>
                ))}
              </div>
              <div className="flex items-center gap-2 glass rounded-xl px-2 py-1">
                <span className="text-xs opacity-80">색상</span>
                {['#111827','#ef4444','#10b981','#3b82f6','#f59e0b','#a855f7'].map(c => (
                  <button key={c} type="button" onClick={() => applyInlineColor(c)}
                          className="w-5 h-5 rounded-full border border-white/20" style={{ background: c }} />
                ))}
                <input type="color" onChange={(e)=>applyInlineColor(e.target.value)} className="w-6 h-6 rounded border border-white/10" />
                <>
                  <button type="button" onClick={() => editorRef.current?.chain().focus().unsetColor().run()} className="text-xs px-2 py-1 rounded hover:bg-white/10">색상 해제</button>
                  <button type="button" onClick={() => editorRef.current?.chain().focus().setMark('textStyle', { fontSize: null }).run()} className="text-xs px-2 py-1 rounded hover:bg-white/10">크기 해제</button>
                </>
              </div>
            </div>
          )}

          {/* TipTap 툴바 (에디터가 준비된 경우에만 표시) */}
          {editorReady && !editorError && (
            <div className="flex flex-wrap items-center gap-2 mb-3 glass rounded-xl p-2">
              {(() => {
                const ed = editorRef.current
                if (!ed) return null
                const btn = (label: string, on: () => void, active = false) => (
                  <button type="button" onClick={on} className={["px-2 py-1 rounded text-xs border border-white/10", active?"bg-white/20":"hover:bg-white/10"].join(' ')}>{label}</button>
                )
                return (
                  <>
                    {btn('본문', () => ed?.chain().focus().setParagraph().run(), ed?.isActive('paragraph'))}
                    {btn('H1', () => ed?.chain().focus().toggleHeading({ level: 1 }).run(), ed?.isActive('heading', { level: 1 }))}
                    {btn('H2', () => ed?.chain().focus().toggleHeading({ level: 2 }).run(), ed?.isActive('heading', { level: 2 }))}
                    {btn('H3', () => ed?.chain().focus().toggleHeading({ level: 3 }).run(), ed?.isActive('heading', { level: 3 }))}
                    <span className="mx-1 opacity-40">|</span>
                    {btn('굵게', () => ed?.chain().focus().toggleBold().run(), ed?.isActive('bold'))}
                    {btn('기울임', () => ed?.chain().focus().toggleItalic().run(), ed?.isActive('italic'))}
                    {btn('취소선', () => ed?.chain().focus().toggleStrike().run(), ed?.isActive('strike'))}
                    <span className="mx-1 opacity-40">|</span>
                    {btn('불릿', () => ed?.chain().focus().toggleBulletList().run(), ed?.isActive('bulletList'))}
                    {btn('번호', () => ed?.chain().focus().toggleOrderedList().run(), ed?.isActive('orderedList'))}
                    {btn('인용', () => ed?.chain().focus().toggleBlockquote().run(), ed?.isActive('blockquote'))}
                    {btn('코드블럭', () => ed?.chain().focus().toggleCodeBlock().run(), ed?.isActive('codeBlock'))}
                    <span className="mx-1 opacity-40">|</span>
                    {btn('구분선', () => ed?.chain().focus().setHorizontalRule().run())}
                    {btn('↶', () => ed?.chain().focus().undo().run())}
                    {btn('↷', () => ed?.chain().focus().redo().run())}
                  </>
                )
              })()}
            </div>
          )}

          {/* 마크다운 도움말 (아코디언) */}
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setHelpOpen(v=>!v)}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/15"
              aria-expanded={helpOpen}
            >
              <span className="text-sm font-semibold">마크다운 도움말</span>
              <span aria-hidden>{helpOpen ? '▴' : '▾'}</span>
            </button>
            {helpOpen && (
              <div className="mt-2 glass rounded-xl p-3 text-sm leading-relaxed">
                <ul className="list-disc pl-5 space-y-1">
                  <li><code># 제목</code>, <code>## 부제목</code>, <code>### 소제목</code></li>
                  <li><code>**굵게**</code>, <code>*기울임*</code>, <code>~~취소선~~</code></li>
                  <li>링크: <code>[텍스트](https://example.com)</code></li>
                  <li>이미지: <code>![alt](https://.../image.png)</code></li>
                  <li>코드 블럭:
                    <pre className="bg-white/5 border border-white/10 rounded-md p-2 mt-1"><code>{"```ts\nconst x = 1\n```"}</code></pre>
                  </li>
                  <li>목록: <code>- 항목</code> 또는 <code>1. 항목</code></li>
                  <li>인용: <code>&gt; 인용문</code></li>
                </ul>
                <div className="mt-3">
                  <div className="font-semibold mb-1">추가 스타일 토큰</div>
                  <p className="opacity-80">HTML 없이 안전하게 크기/색상 적용:</p>
                  <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>크기: <code>{"{{size:24|이 문장은 24px}}"}</code></li>
                    <li>색상: <code>{"{{color:#ef4444|빨간 텍스트}}"}</code></li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl overflow-hidden bg-white/5 border border-white/10">
            {!tipTapLoaded ? (
              <div className="p-4 text-center">
                <div className="text-sm opacity-80 mb-3">WYSIWYG 에디터를 로드하는 중...</div>
                <div className="animate-spin w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full mx-auto"></div>
              </div>
            ) : editorError ? (
              <div className="p-4">
                <div className="text-red-400 mb-2">WYSIWYG 에디터를 로드할 수 없습니다.</div>
                <div className="text-sm opacity-80 mb-3">{editorError}</div>
                <div className="text-sm opacity-60 mb-3">
                  대신 마크다운 에디터를 사용합니다:
                </div>
                <textarea
                  ref={textareaRef}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg min-h-[52vh] md:min-h-[60vh] resize-none font-mono text-sm"
                  placeholder="마크다운으로 작성하세요...

예시:
# 제목
## 부제목
**굵은 글씨**
*기울임*
[링크](https://example.com)
![이미지](https://example.com/image.jpg)

- 목록 항목
- 또 다른 항목

> 인용문

```코드 블록```"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <div className="mt-2 text-xs opacity-60">
                  마크다운 문법을 사용하여 글을 작성할 수 있습니다. 위의 마크다운 도움말을 참고하세요.
                </div>
              </div>
            ) : editorInstance ? (
              <EditorErrorBoundary fallback={
                <div className="p-4 text-center">
                  <div className="text-red-400 mb-2">에디터 렌더링 중 오류가 발생했습니다.</div>
                  <div className="text-sm opacity-80 mb-3">마크다운 에디터로 전환합니다.</div>
                  <textarea
                    ref={textareaRef}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg min-h-[52vh] md:min-h-[60vh] resize-none font-mono text-sm"
                    placeholder="마크다운으로 작성하세요..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
              }>
                <tipTapModules.EditorContent 
                  editor={editorInstance} 
                  className="prose prose-invert max-w-none min-h-[52vh] md:min-h-[60vh] px-3 py-2" 
                />
              </EditorErrorBoundary>
            ) : null}
          </div>

          

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

      </div>
    </PageShell>
  )
}
