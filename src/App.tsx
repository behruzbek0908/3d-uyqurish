import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownToLine, ArrowLeftRight, Box, Building2, Check, ChevronDown, ChevronRight,
  CircleHelp, Copy, DoorOpen, Eye, Grid2X2, House, Layers3, Maximize2, Moon, MousePointer2,
  Redo2, Rotate3D, Save, Search, Settings2, Sun, Trash2, Undo2, X,
} from 'lucide-react'
import SceneCanvas from './components/SceneCanvas'
import { catalog } from './catalog'
import { architectureTemplates } from './templates'
import { useBuilderStore } from './store'
import type { CatalogEntry, MaterialKind, ModelItem } from './types'

type CatalogCategory = CatalogEntry['category']
const materialNames: Record<MaterialKind, string> = {
  wood: 'Yog‘och', brick: 'G‘isht', glass: 'Oyna', metal: 'Metall',
  concrete: 'Beton', tile: 'Kafel', fabric: 'Mato', grass: 'Maysa',
}
const categoryNames: Record<CatalogCategory, string> = { structure: 'Konstruksiya', interior: 'Interyer', exterior: 'Eksteryer' }

function Cursor() {
  const tool = useBuilderStore((state) => state.tool)
  const hoveredName = useBuilderStore((state) => state.hoveredName)
  const [position, setPosition] = useState({ x: -40, y: -40 })
  const [overUi, setOverUi] = useState(false)
  const [grabbing, setGrabbing] = useState(false)
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      setPosition({ x: event.clientX, y: event.clientY })
      setOverUi((event.target as HTMLElement | null)?.closest('button, input, select, [role="button"]') !== null)
    }
    const onDrag = (event: Event) => setGrabbing((event as CustomEvent<{ dragging: boolean }>).detail.dragging)
    const onPointerUp = () => setGrabbing(false)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('forma:drag', onDrag)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    window.addEventListener('blur', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('forma:drag', onDrag)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      window.removeEventListener('blur', onPointerUp)
    }
  }, [])
  const drawing = tool === 'wall' || tool === 'place'
  return <div className={`custom-cursor ${drawing ? 'cursor-draw' : ''} ${overUi ? 'cursor-ui' : ''} ${hoveredName ? 'cursor-object cursor-grab' : ''} ${grabbing ? 'cursor-grabbing' : ''}`} style={{ left: position.x, top: position.y }}>
    <span className="cursor-core">{grabbing ? '✊' : hoveredName ? '✋' : drawing ? '+' : overUi ? '' : '·'}</span>
    {(hoveredName || (drawing && tool === 'wall')) && <span className="cursor-label">{hoveredName || 'Devor chizish'}</span>}
  </div>
}

function App() {
  const {
    items, selectedId, projectName, view, night, tool, past, future, floorCount, activeFloor,
    setView, toggleNight, setTool, editItem, setActiveFloor, loadTemplate,
    removeSelected, duplicateSelected, undo, redo, renameProject,
  } = useBuilderStore()
  const [category, setCategory] = useState<CatalogCategory>('structure')
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const selectedItem = items.find((item) => item.id === selectedId)
  const filteredCatalog = useMemo(() => catalog.filter((entry) => entry.category === category && entry.name.toLowerCase().includes(search.toLowerCase())), [category, search])

  const notify = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2200)
  }
  const exportProject = () => {
    const data = JSON.stringify({ projectName, exportedAt: new Date().toISOString(), units: 'meters', floorCount, activeFloor, items }, null, 2)
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${projectName.trim().replace(/[^a-z0-9-_]+/gi, '-') || 'architecture-project'}.json`
    link.click()
    URL.revokeObjectURL(url)
    notify('Loyiha JSON formatida eksport qilindi')
  }
  const saveProject = () => {
    localStorage.setItem('forma-architecture-project-backup', JSON.stringify({ projectName, floorCount, activeFloor, items }))
    notify('Loyiha ushbu qurilmada saqlandi')
  }
  const addFromCatalog = (entry: CatalogEntry) => {
    if (entry.type === 'wall') {
      setTool('wall')
      return
    }
    setTool('place', entry.type)
  }
  const updateSelected = (patch: Partial<ModelItem>) => {
    if (selectedItem) editItem(selectedItem.id, patch)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, select')) return
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        event.shiftKey ? redo() : undo()
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        redo()
      } else if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        removeSelected()
      } else if (event.key === 'Escape') {
        if (templatesOpen) setTemplatesOpen(false)
        else setTool('select')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [redo, undo, removeSelected, selectedId, setTool, templatesOpen])

  return (
    <main className={`app-shell ${night ? 'theme-night' : ''}`}>
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark"><House size={18} strokeWidth={2.2} /></div>
          <div><div className="brand-name">forma<span>.</span></div><div className="brand-caption">ARCHITECTURE STUDIO</div></div>
          <div className="header-divider" />
          <input className="project-name" value={projectName} onChange={(event) => renameProject(event.target.value)} aria-label="Loyiha nomi" />
          <span className="saved-dot" title="Avtomatik saqlanadi" />
          <span className="autosave-label">Saqlangan</span>
        </div>
        <div className="topbar-center">
          <div className="segmented view-switch">
            <button className={view === '2d' ? 'active' : ''} onClick={() => setView('2d')}><Grid2X2 size={15} /> 2D Chizma</button>
            <button className={view === '3d' ? 'active' : ''} onClick={() => setView('3d')}><Box size={15} /> 3D Model</button>
          </div>
          <div className="history-controls">
            <button title="Orqaga (Ctrl+Z)" disabled={!past.length} onClick={undo}><Undo2 size={17} /></button>
            <button title="Oldinga (Ctrl+Y)" disabled={!future.length} onClick={redo}><Redo2 size={17} /></button>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="icon-button mode-button" onClick={toggleNight} title={night ? 'Kun rejimi' : 'Tun rejimi'}>{night ? <Sun size={17} /> : <Moon size={17} />}<span>{night ? 'Tun' : 'Kun'}</span></button>
          <button className="icon-button save-button" onClick={saveProject}><Save size={16} /><span>Saqlash</span></button>
          <button className="export-button" onClick={exportProject}><ArrowDownToLine size={16} /><span>Eksport</span></button>
        </div>
      </header>

      <section className="workspace">
        <aside className="left-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">LOYIHA MUHITI</span><h2>Quruvchi</h2></div>
            <button className="quiet-icon" title="Panelni sozlash"><Settings2 size={17} /></button>
          </div>
          <div className="tool-section">
            <span className="section-label">ASBOBLAR</span>
            <button className="templates-launch" onClick={() => setTemplatesOpen(true)}>
              <Building2 size={16} />
              <span><strong>Tayyor maketlar</strong><small>Dom va kvartiralar</small></span>
              <ChevronRight size={15} />
            </button>
            <div className="tool-grid">
              <button className={`tool-card ${tool === 'select' ? 'selected' : ''}`} onClick={() => setTool('select')}><MousePointer2 size={17} /><span>Tanlash</span><kbd>V</kbd></button>
              <button className={`tool-card ${tool === 'wall' ? 'selected' : ''}`} onClick={() => setTool('wall')}><span className="wall-tool-icon">⌗</span><span>Devor chizish</span><kbd>W</kbd></button>
              <button className="tool-card" onClick={() => selectedItem && duplicateSelected()} disabled={!selectedItem}><Copy size={16} /><span>Nusxa olish</span></button>
              <button className="tool-card" onClick={() => selectedItem && removeSelected()} disabled={!selectedItem}><Trash2 size={16} /><span>O‘chirish</span><kbd>⌫</kbd></button>
            </div>
          </div>
          <div className="catalog-section">
            <div className="catalog-heading"><span className="section-label">KATALOG</span><span className="catalog-count">{filteredCatalog.length} ta</span></div>
            <label className="search-field"><Search size={15} /><input placeholder="Element qidirish..." value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>/</kbd></label>
            <div className="category-tabs">
              {(Object.keys(categoryNames) as CatalogCategory[]).map((key) => <button key={key} className={category === key ? 'active' : ''} onClick={() => setCategory(key)}>{categoryNames[key]}</button>)}
            </div>
            <div className="catalog-list">
              {filteredCatalog.map((entry) => <button key={entry.type} className={`catalog-item ${tool === 'place' && useBuilderStore.getState().activeType === entry.type ? 'placing' : ''}`} onClick={() => addFromCatalog(entry)} title={`${entry.name} qo‘shish`}>
                <span className={`catalog-icon icon-${entry.category}`}>{entry.icon}</span>
                <span className="catalog-item-copy"><strong>{entry.name}</strong><small>{entry.width.toFixed(1)} × {entry.depth.toFixed(1)} m</small></span>
                <span className="catalog-add">+</span>
              </button>)}
              {!filteredCatalog.length && <div className="empty-search">Mos element topilmadi</div>}
            </div>
          </div>
          <div className="sidebar-bottom">
            <button className="help-link" onClick={() => notify('Sahna: element tanlang, katalogdan qo‘shing yoki devor chizish vositasidan foydalaning.')}><CircleHelp size={16} /> Yordam va qo‘llanma <ChevronRight size={15} /></button>
            <div className="profile-card"><div className="profile-avatar">A</div><div><strong>Arxitektor</strong><small>Shaxsiy ish maydoni</small></div><ChevronDown size={16} /></div>
          </div>
        </aside>

        <section className="canvas-area">
          <div className="canvas-topline">
            <div className="breadcrumb"><span>LOYIHALAR</span><ChevronRight size={13} /><strong>{projectName || 'Yangi loyiha'}</strong></div>
            <div className="canvas-actions"><span className="live-indicator"><i /> {view === '3d' ? '3D KO‘RINISH' : '2D CHIZMA'}</span><button className="canvas-icon" onClick={() => setView(view === '3d' ? '2d' : '3d')} title="Ko‘rinishni almashtirish"><ArrowLeftRight size={16} /></button><button className="canvas-icon" onClick={() => notify('Sahna masshtabi: sichqoncha g‘ildiragi bilan boshqaring')} title="Masshtab"><Maximize2 size={16} /></button></div>
          </div>
          <div className="canvas-holder">
            <SceneCanvas />
            <div className="scene-title"><div className="scene-title-icon"><Layers3 size={15} /></div><div><strong>{floorCount > 1 ? activeFloor === 'all' ? 'Barcha qavatlar' : `${activeFloor}-qavat` : 'Asosiy qavat'}</strong><small>{floorCount > 1 ? `${floorCount} qavat · ${items.length} element` : `${architectureTemplates.find((template) => template.name === projectName)?.area || '48.0 m²'} · 1-qavat`}</small></div><ChevronDown size={15} /></div>
            {floorCount > 1 && <div className="floor-switcher" aria-label="Qavatlar">
              <span>QAVATLAR</span>
              {Array.from({ length: floorCount }, (_, index) => index + 1).map((floor) => <button key={floor} className={activeFloor === floor ? 'active' : ''} onClick={() => setActiveFloor(floor)}>{floor}-qavat</button>)}
              <button className={activeFloor === 'all' ? 'active' : ''} onClick={() => setActiveFloor('all')}>Barchasi</button>
            </div>}
            <div className="scene-compass"><span>N</span><div className="compass-arrow">↑</div><small>0°</small></div>
            <div className="scene-help"><span className="orbit-glyph">⟳</span><span>AYLANTIRISH</span><span className="help-divider" /><span>O‘RTA TUGMA · SURISH</span><span className="help-divider" /><span>SCROLL · ZOOM</span></div>
            {tool === 'wall' && <div className="canvas-hint"><span className="hint-dot" /> Boshlanish nuqtasini belgilang, so‘ng yakun nuqtasini bosing <button onClick={() => setTool('select')}><X size={14} /></button></div>}
            {tool === 'place' && <div className="canvas-hint"><span className="hint-dot" /> {catalog.find((entry) => entry.type === useBuilderStore.getState().activeType)?.name || 'Element'} joylashtirish — sahnani bosing <button onClick={() => setTool('select')}><X size={14} /></button></div>}
            <div className="scale-badge"><span /> 1 m</div>
          </div>
          <div className="canvas-status"><div><span className="status-dot" /> Loyiha sinxronlandi</div><div><span>METRIK</span><span className="status-separator">·</span><span>1 birlik = 1 m</span><span className="status-separator">·</span><span>{items.length} obyekt</span></div><button onClick={() => notify('Forma Architecture Builder · v1.0')}><Eye size={14} /> Sahna holati</button></div>
        </section>

        <aside className="right-panel">
          <div className="inspector-header"><div><span className="eyebrow">OBYEKT SOZLAMALARI</span><h2>Inspector</h2></div><button className="quiet-icon" title="Yopish"><ChevronRight size={17} /></button></div>
          {selectedItem ? <Inspector item={selectedItem} update={updateSelected} onDuplicate={duplicateSelected} onDelete={removeSelected} /> : <div className="inspector-empty"><div className="empty-object-icon"><Box size={24} /></div><strong>Obyekt tanlanmagan</strong><p>Tahrirlash uchun sahnadagi elementni tanlang yoki katalogdan yangisini qo‘shing.</p><button onClick={() => setCategory('structure')}><DoorOpen size={15} /> Katalogni ko‘rish</button></div>}
          <div className="right-panel-footer"><span className="footer-check"><Check size={12} /></span> Barcha o‘lchamlar metrlarda</div>
        </aside>
      </section>
      <Cursor />
      {notice && <div className="toast"><Check size={16} />{notice}</div>}
      {templatesOpen && <div className="templates-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setTemplatesOpen(false)
      }}>
        <section className="templates-dialog" role="dialog" aria-modal="true" aria-labelledby="templates-title">
          <div className="templates-dialog-header">
            <div><span className="eyebrow">FORMA LOYIHA KUTUBXONASI</span><h2 id="templates-title">Tayyor maketlar</h2><p>Tanlang — loyiha barcha devor va jihozlari bilan sahnaga yuklanadi.</p></div>
            <button className="quiet-icon" onClick={() => setTemplatesOpen(false)} aria-label="Yopish"><X size={18} /></button>
          </div>
          <div className="template-cards">
            {architectureTemplates.map((template, index) => <article className="template-card" key={template.id}>
              <div className={`template-preview template-preview-${index + 1}`}>
                <div className="preview-plan"><span /><span /><span /><span /><i /></div>
                <span className="template-floor-badge">{template.subtitle}</span>
              </div>
              <div className="template-card-body">
                <div className="template-card-title"><div><h3>{template.name}</h3><span>{template.area} · {template.floors} qavat</span></div><Building2 size={17} /></div>
                <p>{template.description}</p>
                <div className="template-features">{template.features.map((feature) => <span key={feature}>{feature}</span>)}</div>
                <div className="template-card-footer"><small>{template.items.length} ta 3D obyekt · metrda aniq koordinatalar</small><button onClick={() => {
                  loadTemplate(template)
                  setTemplatesOpen(false)
                  notify(`${template.name} maketi yuklandi`)
                }}>Maketni yuklash <ArrowDownToLine size={14} /></button></div>
              </div>
            </article>)}
          </div>
        </section>
      </div>}
      <button className="mobile-menu" title="Menyu" onClick={() => notify('Yon panellar katta ekranda to‘liq ishlaydi')}><Layers3 size={18} /></button>
    </main>
  )
}

function Inspector({ item, update, onDuplicate, onDelete }: { item: ModelItem; update: (patch: Partial<ModelItem>) => void; onDuplicate: () => void; onDelete: () => void }) {
  const setNumber = (key: 'width' | 'depth' | 'height', value: string) => {
    const number = Number(value)
    if (Number.isFinite(number) && number > 0) update({ [key]: Math.min(number, 100) })
  }
  const setPosition = (index: number, value: string) => {
    const number = Number(value)
    if (!Number.isFinite(number)) return
    const position: [number, number, number] = [...item.position]
    position[index] = number
    update({ position })
  }
  return <div className="inspector-content">
    <div className="selected-object">
      <div className="selected-object-icon">{catalog.find((entry) => entry.type === item.type)?.icon || '▰'}</div>
      <div className="selected-object-name"><strong>{item.name}</strong><small>{item.type.toUpperCase()} · #{item.id.slice(0, 5)}</small></div>
      <button className="quiet-icon" title="Boshqa nom berish" onClick={() => update({ name: `${item.name}*` })}><Settings2 size={16} /></button>
    </div>
    <div className="inspector-actions"><button onClick={onDuplicate}><Copy size={14} /> Nusxa</button><button onClick={onDelete}><Trash2 size={14} /> O‘chirish</button></div>
    <section className="inspector-section">
      <div className="inspector-section-title"><span>O‘LCHAMLAR</span><button className="unit-toggle">m <ChevronDown size={12} /></button></div>
      <div className="dimension-grid">
        <NumberField label="Eni" value={item.width} onChange={(value) => setNumber('width', value)} />
        <NumberField label="Chuqurligi" value={item.depth} onChange={(value) => setNumber('depth', value)} />
        <NumberField label="Balandligi" value={item.height} onChange={(value) => setNumber('height', value)} />
      </div>
      <div className="measurement-note"><span className="ruler-icon">↔</span> Aniq o‘lcham · santimetrgacha</div>
    </section>
    <section className="inspector-section">
      <div className="inspector-section-title"><span>JOYLASHUV</span><button className="reset-transform" onClick={() => update({ position: [0, item.position[1], 0], rotation: 0 })}>Tiklash</button></div>
      <div className="position-grid">{(['X', 'Y', 'Z'] as const).map((label, index) => <label className="field-wrap" key={label}><span>{label}</span><input type="number" step="0.1" value={item.position[index].toFixed(2)} onChange={(event) => setPosition(index, event.target.value)} /><small>m</small></label>)}</div>
      <label className="rotation-field"><span><Rotate3D size={14} /> Burilish</span><div><input type="number" step="15" value={Math.round(item.rotation * 180 / Math.PI)} onChange={(event) => update({ rotation: Number(event.target.value) * Math.PI / 180 })} /><small>°</small></div></label>
    </section>
    <section className="inspector-section material-section">
      <div className="inspector-section-title"><span>MATERIAL VA RANG</span></div>
      <label className="select-field"><span>Material</span><select value={item.material} onChange={(event) => update({ material: event.target.value as MaterialKind })}>{Object.entries(materialNames).map(([key, name]) => <option value={key} key={key}>{name}</option>)}</select><ChevronDown size={14} /></label>
      <div className="color-row"><span>Rang</span><label className="color-picker"><input type="color" value={item.color} onChange={(event) => update({ color: event.target.value })} /><span className="color-preview" style={{ backgroundColor: item.color }} /><code>{item.color.toUpperCase()}</code></label></div>
      <div className="swatch-list">{['#c8b08e', '#e7e2d9', '#777f80', '#a7b3a5', '#bf8059', '#b8ccd2'].map((color) => <button className={item.color.toLowerCase() === color ? 'chosen' : ''} key={color} style={{ background: color }} onClick={() => update({ color })} title={color} />)}</div>
    </section>
    <section className="inspector-section layer-section">
      <div className="inspector-section-title"><span>QATLAMLAR</span><span className="layer-count">01</span></div>
      <div className="layer-row"><span className="layer-color" style={{ background: item.color }} /><span>{item.name}</span><Eye size={14} /></div>
    </section>
  </div>
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) {
  return <label className="dimension-field"><span>{label}</span><div><input type="number" min="0.05" max="100" step="0.1" value={value.toFixed(2)} onChange={(event) => onChange(event.target.value)} /><small>m</small></div></label>
}

export default App
