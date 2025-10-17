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

  componentDidCatch(_error: Error, _errorInfo: any) {}

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
  const [styleTextColor, setStyleTextColor] = useState<string>('#111827')
  const [styleFontSize, setStyleFontSize] = useState<number>(16)
  const [helpOpen, setHelpOpen] = useState<boolean>(false)
  const [editorReady, setEditorReady] = useState<boolean>(false)
  const [editorError, setEditorError] = useState<string | null>(null)
  const [tipTapLoaded, setTipTapLoaded] = useState<boolean>(false)
  const [tipTapModules, setTipTapModules] = useState<any>(null)
  const [editorInstance, setEditorInstance] = useState<any>(null)
  const [currentFontSize, setCurrentFontSize] = useState<string | null>(null)
  const [currentColor, setCurrentColor] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement|null>(null)
  const editorRef = useRef<any>(null)

  // TipTap 동적 로드
  useEffect(() => {
    const loadTipTap = async () => {
      
      try {
        const [
          { EditorContent, Editor },
          Core,
          StarterKit,
          TextStyle,
          Color,
          Link,
          Image,
          TextAlign
        ] = await Promise.all([
          import('@tiptap/react'),
          import('@tiptap/core'),
          import('@tiptap/starter-kit'),
          import('@tiptap/extension-text-style'),
          import('@tiptap/extension-color'),
          import('@tiptap/extension-link'),
          import('@tiptap/extension-image'),
          import('@tiptap/extension-text-align')
        ])

        

        setTipTapModules({
          EditorContent,
          Editor,
          Core,
          StarterKit,
          TextStyle,
          Color,
          Link,
          Image,
          TextAlign
        })
        setTipTapLoaded(true)
      } catch (error) {
        
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
        
        const { Editor, Core, StarterKit, TextStyle, Color, Link, Image, TextAlign } = tipTapModules

        // 동적 임포트 호환: default / named 모두 처리
        const StarterKitExt = StarterKit?.default ?? StarterKit
        const TextStyleExt = TextStyle?.default ?? TextStyle?.TextStyle ?? TextStyle
        const ColorExt = (Color?.default ?? Color?.Color ?? Color)?.configure?.({ types: ['textStyle'] })
        // Link 확장은 중복 경고 회피를 위해 제외 (StarterKit 조합/환경에 따라 중복 경고 발생)
        const LinkExt = null
        const ImageExt = (Image?.default ?? Image)?.configure?.({ inline: false, allowBase64: true })
        const TextAlignExt = (TextAlign?.default ?? TextAlign)?.configure?.({ types: ['heading','paragraph'] })

        // FontSize 확장 (전역 속성 + 커맨드)
        const Extension = Core?.Extension ?? Core?.default?.Extension ?? null
        const FontSizeExt = Extension ? Extension.create({
          name: 'fontSize',
          addGlobalAttributes() {
            return [
              {
                types: ['textStyle'],
                attributes: {
                  fontSize: {
                    default: null,
                    parseHTML: (element: HTMLElement) => element.style?.fontSize || null,
                    renderHTML: (attributes: { fontSize?: string | null }) => {
                      if (!attributes?.fontSize) return {}
                      return { style: `font-size: ${attributes.fontSize}` }
                    },
                  },
                },
              },
            ]
          },
          addCommands() {
            return {
              setFontSize:
                (fontSize: string) => ({ chain }: any) =>
                  chain().setMark('textStyle', { fontSize }).run(),
              unsetFontSize:
                () => ({ chain }: any) =>
                  chain().setMark('textStyle', { fontSize: null }).run(),
            }
          },
        }) : null

        const extensions = [
          StarterKitExt,
          TextStyleExt,
          ColorExt,
          FontSizeExt,
          LinkExt,
          ImageExt,
          TextAlignExt,
        ].filter(Boolean)
        
        const editor = new Editor({
          extensions,
          content: content || '<p></p>',
          onUpdate: ({ editor }: any) => {
            const newContent = editor.getHTML()
            // content가 실제로 변경되었을 때만 상태 업데이트
            if (newContent !== content) {
              setContent(newContent)
            }
            setEditorReady(true)
            try {
              const attrs = editor.getAttributes('textStyle') || {}
              setCurrentFontSize(attrs.fontSize ?? null)
              setCurrentColor(attrs.color ?? null)
            } catch {}
          },
          onCreate: ({ editor }: any) => {
            editorRef.current = editor
            setEditorReady(true)
            setEditorError(null)
            try {
              const attrs = editor.getAttributes('textStyle') || {}
              setCurrentFontSize(attrs.fontSize ?? null)
              setCurrentColor(attrs.color ?? null)
            } catch {}
          },
        })
        
        setEditorInstance(editor)
      } catch (error) {
        
        setEditorError(error instanceof Error ? error.message : '알 수 없는 오류')
      }
    }

    createEditor()
  }, [tipTapModules])

  // content 변경 시 에디터 내용 업데이트 (에디터가 외부에서 content를 변경받을 때)
  useEffect(() => {
    if (editorInstance && content && editorInstance.getHTML() !== content) {
      editorInstance.commands.setContent(content)
    }
  }, [content, editorInstance])

  // 컴포넌트 언마운트 시 에디터 정리
  useEffect(() => {
    return () => {
      if (editorInstance) {
        editorInstance.destroy()
      }
    }
  }, [editorInstance])

  // 에디터 인스턴스가 생성되면 ref 동기화 (예외 상황 대비)
  useEffect(() => {
    if (editorInstance && !editorRef.current) {
      editorRef.current = editorInstance
    }
    if (editorInstance) {
      // 선택 변화 시 현재 스타일 추적 → 토글 상태 즉시 반영
      editorInstance.on('selectionUpdate', ({ editor }: any) => {
        try {
          const attrs = editor.getAttributes('textStyle') || {}
          setCurrentFontSize(attrs.fontSize ?? null)
          setCurrentColor(attrs.color ?? null)
        } catch {}
      })
      editorInstance.on('transaction', ({ editor }: any) => {
        try {
          const attrs = editor.getAttributes('textStyle') || {}
          setCurrentFontSize(attrs.fontSize ?? null)
          setCurrentColor(attrs.color ?? null)
        } catch {}
      })
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
        setStyleTextColor(p.style?.textColor || '#111827')
        setStyleFontSize(p.style?.fontSize || 16)
      })
      .catch(_err => {
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
    try {
      const ed: any = editorRef.current
      if (!ed) return
      const size = `${px}px`
      const same = (currentFontSize || '').replace(/\s+/g,'') === size
      const chain = ed.chain().focus()
      if (same) {
        chain.setMark('textStyle', { fontSize: null }).run()
      } else {
        chain.setMark('textStyle', { fontSize: size }).run()
      }
    } catch {}
  }
  const applyInlineColor = (color: string) => {
    try {
      const ed: any = editorRef.current
      if (!ed) return
      const same = (currentColor || '').toLowerCase() === (color || '').toLowerCase()
      const chain = ed.chain().focus()
      if (same) {
        chain.unsetColor().run()
      } else {
        chain.setColor(color).run()
      }
    } catch {}
  }

  const onFiles = async (files: FileList | null) => {
    if(!files) return
    try{
      const uploaded: Attachment[] = []
      for (const f of Array.from(files)) {
        const att = await uploadFile(f)
        uploaded.push(att)
        if ((att.type || '').startsWith('image/')) {
          const defaultAlt = att.name || 'image'
          const alt = prompt('이미지 설명(alt)을 입력하세요:', defaultAlt) ?? defaultAlt
          if (editorRef.current) {
            editorRef.current.chain().focus().setImage({ src: att.url, alt }).run()
          } else {
            insertMarkdown(`\n\n![${alt}](${att.url})\n\n`)
          }
        }
      }
      setAttachments(prev=>[...prev,...uploaded])
    }catch(_e){
      alert('파일 업로드에 실패했습니다.')
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
    }catch(_e){
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
        <div className="glass rounded-2xl p-3" style={{ overflow: 'visible' }}>
          <input
            className="w-full bg-transparent text-xl md:text-2xl font-semibold mb-3 outline-none"
            placeholder="제목" value={title} onChange={e=>setTitle(e.target.value)}
            style={{ fontFamily: 'Gulim, 굴림, sans-serif' }} />

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

          {/* 툴바(인라인/서식) 고정: 하나의 sticky 래퍼로 통일 */}
          {editorReady && !editorError && (
            <div className="sticky top-2 md:top-16 z-20 space-y-2 pointer-events-auto">
              <div className="flex flex-wrap items-center gap-2 glass rounded-xl px-2 py-1" role="toolbar" aria-label="인라인 스타일 도구">
                <span className="text-xs opacity-80">크기</span>
                {[14,16,18,20,22,24,28,32].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => applyInlineSize(s)}
                    className={["text-xs px-2 py-1 rounded border border-white/10 transition-colors",
                      currentFontSize === `${s}px` ? 'bg-black/10' : 'hover:bg-black/5'
                    ].join(' ')}
                  >{s}</button>
                ))}
              </div>
              <div className="flex items-center gap-2 glass rounded-xl px-2 py-1">
                <span className="text-xs opacity-80">색상</span>
                {['#111827','#ef4444','#10b981','#3b82f6','#f59e0b','#a855f7'].map(c => (
                  <button key={c} type="button" onClick={() => applyInlineColor(c)}
                          className={["w-5 h-5 rounded-full border border-white/20 ring-0 focus:ring-2 focus:ring-black/20",
                            (currentColor||'').toLowerCase() === c.toLowerCase() ? 'ring-2 ring-black/30' : ''
                          ].join(' ')} style={{ background: c }} />
                ))}
                <input type="color" onChange={(e)=>applyInlineColor(e.target.value)} className="w-6 h-6 rounded border border-white/10 focus:ring-2 focus:ring-black/20" />
                <>
                  <button type="button" onClick={() => editorRef.current?.chain().focus().unsetColor().run()} className="text-xs px-2 py-1 rounded hover:bg-white/10">색상 해제</button>
                  <button type="button" onClick={() => editorRef.current?.chain().focus().setMark('textStyle', { fontSize: null }).run()} className="text-xs px-2 py-1 rounded hover:bg-white/10">크기 해제</button>
                </>
              </div>
              <div className="flex flex-wrap items-center gap-2 glass rounded-xl p-2" role="toolbar" aria-label="서식 도구">
                {(() => {
                const ed = editorRef.current
                if (!ed) return null
                const btn = (label: string, on: () => void, active = false) => (
                  <button type="button" onClick={on} className={["px-2 py-1 rounded text-xs border border-white/10 transition-colors", active?"bg-black/10":"hover:bg-black/5"].join(' ')}>{label}</button>
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
            </div>
          )}

          {/* 마크다운 도움말 제거됨 */}

          {/* 구분선/인용 스타일은 전역 .prose 규칙으로 통일 */}

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
                  style={{ fontFamily: 'Gulim, 굴림, sans-serif' }}
                />
                <div className="mt-2 text-xs opacity-60">
                  마크다운 문법을 사용하여 글을 작성할 수 있습니다. 위의 마크다운 도움말을 참고하세요.
                </div>
              </div>
            ) : editorInstance ? (
              (() => {
                const EC = tipTapModules?.EditorContent
                if (!EC) return null
                const handleSurfaceClick = (e: React.MouseEvent<HTMLDivElement>) => {
                  const target = e.target as HTMLElement
                  const isInsideProse = !!target.closest('.ProseMirror')
                  if (!isInsideProse && editorRef.current) {
                    e.preventDefault()
                    editorRef.current.chain().focus().run()
                  }
                }
                return (
              <div
                className="relative z-0 min-h-[52vh] md:min-h-[60vh] px-3 py-2 cursor-text editor-content"
                    onMouseDown={handleSurfaceClick}
                    role="textbox"
                    aria-label="본문 입력 영역"
                  >
                    <EC
                      editor={editorInstance}
                      className="prose max-w-none"
                      style={{ fontFamily: 'Gulim, 굴림, sans-serif', color: styleTextColor }}
                    />
                  </div>
                )
              })()
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
