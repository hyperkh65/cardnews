'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Settings,
  Download,
  Layers,
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Triangle,
  Star,
  Heart,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Trash2,
  CheckCircle,
  Move,
  Upload,
  Palette,
  Layout,
  Sticker,
  Smile,
  Zap,
  BoxSelect,
  LayoutTemplate,
  Monitor,
  Plus,
  Copy,
  FilePlus,
  Files
} from 'lucide-react';
import styles from './editor.module.css';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';

// Import Templates Data
import { TEMPLATES, TEMPLATE_CATEGORIES } from '@/data/templates';

// --- Assets Data ---
const SHAPE_ICONS = [
  { id: 'rect', icon: Square, label: '사각형' },
  { id: 'circle', icon: Circle, label: '원형' },
  { id: 'triangle', icon: Triangle, label: '삼각형' },
  { id: 'star', icon: Star, label: '별' },
  { id: 'heart', icon: Heart, label: '하트' },
  { id: 'zap', icon: Zap, label: '번개' },
];

export default function ClassicEditorPage() {
  // --- State ---
  const [activeTab, setActiveTab] = useState('templates');

  // Canvas State & Constants
  const CANVAS_WIDTH = 480;
  const CANVAS_HEIGHT = 600;

  // -- Page State Management --
  const [pages, setPages] = useState([{
    id: 1,
    elements: [
      { id: 'el_1', type: 'text', content: '나만의 카드뉴스', x: 90, y: 150, fontSize: 48, fontWeight: '800', color: '#111111', align: 'center', width: 300, opacity: 1 },
    ],
    background: {
      type: 'color',
      value: '#ffffff',
      bgImage: null,
      bgOpacity: 1,
      overlayImage: null,
      overlayOpacity: 1,
      overlayX: 0,
      overlayY: 0,
      overlayScale: 1
    }
  }]);
  const [activePageId, setActivePageId] = useState(1);

  // Derived state for compatibility with existing render logic
  const activePage = pages.find(p => p.id === activePageId) || pages[0];
  const elements = activePage.elements;
  const background = activePage.background;
  const activePageIndex = pages.findIndex(p => p.id === activePageId);

  // State Setters Wrappers (to maintain existing handler compatibility)
  const setElements = (newElementsOrFn) => {
    setPages(prev => prev.map(p => {
      if (p.id !== activePageId) return p;
      const newEls = typeof newElementsOrFn === 'function' ? newElementsOrFn(p.elements) : newElementsOrFn;
      return { ...p, elements: newEls };
    }));
  };

  const setBackground = (newBgOrFn) => {
    setPages(prev => prev.map(p => {
      if (p.id !== activePageId) return p;
      const newBg = typeof newBgOrFn === 'function' ? newBgOrFn(p.background) : newBgOrFn;
      return { ...p, background: newBg };
    }));
  };

  // Page Management Handlers
  const addPage = () => {
    const newId = Date.now();
    setPages(prev => [...prev, {
      id: newId,
      elements: [],
      background: { ...background, bgImage: null, overlayImage: null, value: '#ffffff' } // Reset or inherit? Let's reset but keep simple defaults
    }]);
    setActivePageId(newId);
  };

  const duplicatePage = () => {
    const newId = Date.now();
    const clonedPage = JSON.parse(JSON.stringify(activePage));
    clonedPage.id = newId;

    // Insert after current page
    const idx = pages.findIndex(p => p.id === activePageId);
    const newPages = [...pages];
    newPages.splice(idx + 1, 0, clonedPage);

    setPages(newPages);
    setActivePageId(newId);
  };

  const deletePage = (e, id) => {
    e.stopPropagation();
    if (pages.length <= 1) {
      alert('최소 한 장의 페이지는 있어야 합니다.');
      return;
    }
    const newPages = pages.filter(p => p.id !== id);
    setPages(newPages);
    if (activePageId === id) {
      setActivePageId(newPages[Math.max(0, newPages.length - 1)].id);
    }
  };

  const [selectedId, setSelectedId] = useState(null);

  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0 });

  // Refs
  const previewRef = useRef(null);
  const bgInputRef = useRef(null);
  const overlayInputRef = useRef(null);

  const selectedElement = elements.find(el => el.id === selectedId);

  // --- Handlers ---

  const applyTemplate = (template) => {
    if (confirm('현재 캔버스 내용이 초기화됩니다. 템플릿을 적용하시겠습니까?')) {
      setElements(JSON.parse(JSON.stringify(template.elements)));
      setBackground({
        ...template.background,
        bgOpacity: template.background.bgOpacity ?? 1,
        overlayOpacity: template.background.overlayOpacity ?? 1,
        overlayX: 0, overlayY: 0, overlayScale: 1
      });
      setSelectedId(null);
    }
  };

  const handleSelect = (id, e) => {
    e?.stopPropagation();
    setSelectedId(id);
  };

  const handleBgClick = () => {
    // If we have an overlay, set selectedId to 'overlay' to show drag handles logic (conceptual)
    // Here we just set selectedId to null for deselection if clicking empty space
    // EXCEPT if we are targeting the overlay.
    // For simplicity, let's treat 'overlay' as a special selectedId string if we want sidebar to show overlay props
    if (background.overlayImage) {
      setSelectedId('overlay');
      setActiveTab('bg'); // Auto switch tab to BG for properties
    } else {
      setSelectedId(null);
    }
  };

  const addElement = (type, subType = null) => {
    const newId = `el_${Date.now()}`;
    let newEl = { id: newId, type, x: 150, y: 150, opacity: 1, rotation: 0 };

    if (type === 'text') {
      newEl = { ...newEl, content: '새 텍스트', fontSize: 24, fontWeight: '600', color: '#000000', width: 200, align: 'left' };
    } else if (type === 'shape') {
      newEl = { ...newEl, shapeType: subType, width: 100, height: 100, color: '#3b82f6' };
    }

    setElements([...elements, newEl]);
    setSelectedId(newId);
  };

  const updateElement = (id, key, value) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, [key]: value } : el));
  };

  const handleDelete = () => {
    if (selectedId && selectedId !== 'overlay') {
      setElements(prev => prev.filter(el => el.id !== selectedId));
      setSelectedId(null);
    }
  };

  const handleImageUpload = (e, target) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (target === 'bg') {
        setBackground(prev => ({ ...prev, bgImage: reader.result, type: 'image' }));
      } else {
        setBackground(prev => ({ ...prev, overlayImage: reader.result }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // --- Drag Logic ---
  const handleMouseDown = (e, id) => {
    e.stopPropagation();
    e.preventDefault();

    // Check if dragging overlay
    if (id === 'overlay') {
      setSelectedId('overlay');
      setIsDragging(true);
      setDragOffset({ x: e.clientX, y: e.clientY });
      setInitialPos({ x: background.overlayX, y: background.overlayY });
      return;
    }

    const el = elements.find(item => item.id === id);
    if (!el) return;

    setSelectedId(id);
    setIsDragging(true);
    setDragOffset({ x: e.clientX, y: e.clientY });
    setInitialPos({ x: el.x, y: el.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !selectedId) return;

    const dx = e.clientX - dragOffset.x;
    const dy = e.clientY - dragOffset.y;
    const newX = initialPos.x + dx;
    const newY = initialPos.y + dy;

    if (selectedId === 'overlay') {
      setBackground(prev => ({ ...prev, overlayX: newX, overlayY: newY }));
    } else {
      setElements(prev => prev.map(el => {
        if (el.id === selectedId) {
          return { ...el, x: newX, y: newY };
        }
        return el;
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, selectedId]);


  // Ref for all pages export
  const pageRefs = useRef({});

  const handleDownload = async () => {
    if (pages.length === 1) {
      // Single download
      if (!previewRef.current) return;
      try {
        const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: null });
        const link = document.createElement('a');
        link.download = `design-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (e) {
        alert('다운로드 실패');
      }
    } else {
      // Multi download (ZIP)
      const zip = new JSZip();
      let count = 0;

      try {
        // We need to temporarily render all pages or assume they are in DOM (if we rendered them hidden).
        // But currently the editor only renders ONE page at a time mostly.
        // Strategy: We can't capture non-rendered pages easily. 
        // Better Strategy for Editor: 
        // 1. Alert user that we will download CURRENT page only? 
        // 2. OR, quickly flip through pages? (Bad UX, flickering)
        // 3. OR, Render all pages in a hidden container (like Maker).

        // Let's implement the "Hidden Container" strategy for full export.
        // We need a helper to render a page content cleanly.

        // For now, to keep it simple and robust:
        // Let's just download the CURRENT page for now, but if the user wants "All", we might need that hidden container logic.
        // Given the user specifically asked "Add page functionality", they probably expect to download the set.
        // I will add a "HiddenExportContainer" at the bottom of the JSX that renders ALL pages.

        for (let i = 0; i < pages.length; i++) {
          const pageId = pages[i].id;
          const el = pageRefs.current[pageId];
          if (!el) continue;

          const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null });
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
          zip.file(`slide-${i + 1}.png`, blob);
          count++;
        }

        if (count > 0) {
          const content = await zip.generateAsync({ type: 'blob' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(content);
          link.download = `card-news-project-${Date.now()}.zip`;
          link.click();
        }
      } catch (e) {
        console.error(e);
        alert('전체 다운로드 실패');
      }
    }
  };

  const renderShapeIcon = (type, size = 24) => {
    const IconData = SHAPE_ICONS.find(s => s.id === type);
    const Icon = IconData ? IconData.icon : Square;
    return <Icon size={size} />;
  }

  const [selectedCategory, setSelectedCategory] = useState('전체');
  const filteredTemplates = selectedCategory === '전체'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === selectedCategory);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/" className={styles.backButton}>
            <ChevronLeft size={20} />
          </Link>
          <div className={styles.title}>
            <div className={styles.titleIcon}>
              <BoxSelect size={14} />
            </div>
            클래식 에디터 Pro
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.downloadButton} onClick={handleDownload} style={{ gap: 6 }}>
            <Download size={14} /> {pages.length > 1 ? '전체 다운로드' : '다운로드'}
          </button>
        </div>
      </header>

      <div className={styles.main}>
        {/* Left Panel: Asset Library */}
        <aside className={styles.leftPanel}>
          {/* Tab Rail */}
          <div className={styles.tabRail}>
            <button onClick={() => setActiveTab('templates')} className={`${styles.tabButton} ${activeTab === 'templates' ? styles.tabButtonActive : ''}`}>
              <LayoutTemplate size={20} /> <span className={styles.tabLabel}>템플릿</span>
            </button>
            <button onClick={() => setActiveTab('layers')} className={`${styles.tabButton} ${activeTab === 'layers' ? styles.tabButtonActive : ''}`}>
              <Layers size={20} /> <span className={styles.tabLabel}>레이어</span>
            </button>
            <button onClick={() => setActiveTab('assets')} className={`${styles.tabButton} ${activeTab === 'assets' ? styles.tabButtonActive : ''}`}>
              <Layout size={20} /> <span className={styles.tabLabel}>요소</span>
            </button>
            <button onClick={() => setActiveTab('bg')} className={`${styles.tabButton} ${activeTab === 'bg' || selectedId === 'overlay' ? styles.tabButtonActive : ''}`}>
              <ImageIcon size={20} /> <span className={styles.tabLabel}>배경</span>
            </button>
          </div>

          {/* Drawer Content */}
          <div className={styles.drawer}>
            {/* --- Templates Tab --- */}
            {activeTab === 'templates' && (
              <>
                <div className={styles.drawerHeader}>템플릿 선택</div>

                <div style={{ padding: '8px 16px', display: 'flex', gap: 6, overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '4px 8px', borderRadius: 12, border: 'none', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
                        background: selectedCategory === cat ? '#3b82f6' : '#27272a', /* Blue 500 */
                        color: selectedCategory === cat ? 'white' : '#a1a1aa'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className={styles.drawerContent} style={{ padding: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {filteredTemplates.map(tmpl => (
                      <div
                        key={tmpl.id}
                        className={styles.assetItem}
                        style={{ aspectRatio: '4/5', flexDirection: 'column', alignItems: 'stretch', padding: 0, overflow: 'hidden', background: '#ffffff' }}
                        onClick={() => applyTemplate(tmpl)}
                      >
                        <div style={{ flex: 1, backgroundColor: tmpl.thumbnailBg, position: 'relative', overflow: 'hidden' }}>
                          <div style={{ padding: 10, transform: 'scale(0.3)', transformOrigin: 'top left', width: '330%', pointerEvents: 'none' }}>
                            {tmpl.elements.filter(e => e.type === 'text').map((e, idx) => (
                              <div key={idx} style={{
                                position: 'absolute', left: e.x, top: e.y, color: e.color, fontSize: e.fontSize, fontWeight: e.fontWeight, width: e.width
                              }}>
                                {e.content}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ padding: 8, background: '#1e1e2e', fontSize: 11, color: '#e4e4e7', borderTop: '1px solid #3f3f46' }}>
                          {tmpl.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* --- Layers Tab --- */}
            {activeTab === 'layers' && (
              <>
                <div className={styles.drawerHeader}>레이어</div>
                <div className={styles.drawerContent}>
                  {/* Overlay Layer */}
                  {background.overlayImage && (
                    <div
                      className={`${styles.layerItem} ${selectedId === 'overlay' ? styles.layerItemActive : ''}`}
                      onClick={(e) => { handleSelect('overlay', e); setActiveTab('bg'); }}
                    >
                      <Monitor size={16} />
                      <span style={{ fontSize: 13, flex: 1 }}>오버레이 (배경 장식)</span>
                    </div>
                  )}

                  {elements.slice().reverse().map((el, idx) => (
                    <div
                      key={el.id}
                      className={`${styles.layerItem} ${selectedId === el.id ? styles.layerItemActive : ''}`}
                      onClick={(e) => handleSelect(el.id, e)}
                    >
                      {el.type === 'text' ? <Type size={16} /> : <Sticker size={16} />}
                      <span style={{ fontSize: 13, flex: 1 }}>{el.type === 'text' ? el.content : `도형 (${el.shapeType})`}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* --- Assets Tab --- */}
            {activeTab === 'assets' && (
              <>
                <div className={styles.drawerHeader}>추가할 요소 선택</div>
                <div className={styles.drawerContent}>
                  <h4 className={styles.propLabel}>기본 도형</h4>
                  <div className={styles.assetGrid}>
                    {SHAPE_ICONS.map(shape => (
                      <div key={shape.id} className={styles.assetItem} onClick={() => addElement('shape', shape.id)} title={shape.label}>
                        <shape.icon size={24} />
                      </div>
                    ))}
                  </div>

                  <h4 className={styles.propLabel} style={{ marginTop: 24 }}>텍스트 추가</h4>
                  <button className={styles.uploadBox} style={{ height: 48, flexDirection: 'row', width: '100%' }} onClick={() => addElement('text')}>
                    <Type size={16} /> 텍스트 상자 추가
                  </button>
                </div>
              </>
            )}

            {/* --- Background Tab --- */}
            {activeTab === 'bg' && (
              <>
                <div className={styles.drawerHeader}>배경 & 오버레이 설정</div>
                <div className={styles.drawerContent}>
                  <h4 className={styles.propLabel}>배경 레이어 (맨 뒤)</h4>
                  <div className={styles.uploadBox} onClick={() => bgInputRef.current?.click()}>
                    {background.bgImage ? (
                      <img src={background.bgImage} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} />
                    ) : (
                      <>
                        <Upload size={24} />
                        <span>배경 이미지 업로드</span>
                      </>
                    )}
                  </div>
                  <input type="file" ref={bgInputRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'bg')} />

                  {background.bgImage && (
                    <div className={styles.propRow} style={{ marginTop: 12 }}>
                      <span className={styles.propLabel}>배경 불투명도</span>
                      <div className={styles.sliderContainer}>
                        <input type="range" min="0" max="1" step="0.1" className={styles.rangeInput} value={background.bgOpacity} onChange={(e) => setBackground({ ...background, bgOpacity: parseFloat(e.target.value) })} />
                      </div>
                    </div>
                  )}

                  <div className={styles.propLabel} style={{ marginTop: 20 }}>배경 색상 (이미지 없을 시)</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="color" className={styles.colorPreview} value={background.value} onChange={(e) => setBackground({ ...background, value: e.target.value })} />
                    <input type="text" className={styles.propInput} value={background.value} onChange={(e) => setBackground({ ...background, value: e.target.value })} />
                  </div>

                  <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '24px 0' }}></div>

                  <h4 className={styles.propLabel}>오버레이 레이어</h4>
                  <div className={styles.uploadBox} onClick={() => overlayInputRef.current?.click()}>
                    {background.overlayImage ? (
                      <img src={background.overlayImage} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <>
                        <Monitor size={24} />
                        <span>오버레이 업로드</span>
                      </>
                    )}
                  </div>
                  <input type="file" ref={overlayInputRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'overlay')} />

                  {background.overlayImage && (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div className={styles.propRow}>
                        <span className={styles.propLabel}>오버레이 불투명도</span>
                        <div className={styles.sliderContainer}>
                          <input type="range" min="0" max="1" step="0.1" className={styles.rangeInput} value={background.overlayOpacity} onChange={(e) => setBackground({ ...background, overlayOpacity: parseFloat(e.target.value) })} />
                        </div>
                      </div>
                      <div className={styles.propRow}>
                        <span className={styles.propLabel}>크기 (비율)</span>
                        <div className={styles.sliderContainer}>
                          <input type="range" min="0.1" max="2" step="0.1" className={styles.rangeInput} value={background.overlayScale} onChange={(e) => setBackground({ ...background, overlayScale: parseFloat(e.target.value) })} />
                        </div>
                      </div>
                      <div className={styles.inputGroup}>
                        <div><div className={styles.propLabel}>위치 X</div><input type="number" className={styles.propInput} value={background.overlayX} onChange={(e) => setBackground({ ...background, overlayX: parseInt(e.target.value) || 0 })} /></div>
                        <div><div className={styles.propLabel}>위치 Y</div><input type="number" className={styles.propInput} value={background.overlayY} onChange={(e) => setBackground({ ...background, overlayY: parseInt(e.target.value) || 0 })} /></div>
                      </div>
                    </div>
                  )}

                </div>
              </>
            )}
          </div>
        </aside>

        {/* Center: Canvas Area */}
        <main className={styles.canvasArea} onClick={handleBgClick}>
          <div className={styles.canvasWrapper} ref={previewRef} style={{ backgroundColor: background.value }}>
            {/* 1. Background Image */}
            {background.bgImage && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `url(${background.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0, opacity: background.bgOpacity }} />
            )}

            {/* 2. Overlay Image */}
            {background.overlayImage && (
              <div
                onMouseDown={(e) => handleMouseDown(e, 'overlay')}
                style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  backgroundImage: `url(${background.overlayImage})`,
                  backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                  zIndex: 5,
                  opacity: background.overlayOpacity,
                  transform: `translate(${background.overlayX}px, ${background.overlayY}px) scale(${background.overlayScale})`,
                  cursor: isDragging && selectedId === 'overlay' ? 'grabbing' : 'grab',
                  outline: selectedId === 'overlay' ? '2px dashed #8b5cf6' : 'none',
                  pointerEvents: 'auto' // Make clickable
                }}
              />
            )}

            {/* 3. Elements */}
            {elements.map(el => (
              <div
                key={el.id}
                onMouseDown={(e) => handleMouseDown(e, el.id)}
                style={{
                  position: 'absolute',
                  left: el.x,
                  top: el.y,
                  width: el.width,
                  height: el.type === 'shape' ? el.height : 'auto',
                  fontSize: el.fontSize,
                  fontWeight: el.fontWeight,
                  color: el.color,
                  textAlign: el.align,
                  zIndex: 10, // Topmost
                  cursor: isDragging ? 'grabbing' : 'grab',
                  outline: selectedId === el.id ? '2px dashed #8b5cf6' : 'none',
                  opacity: el.opacity,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  userSelect: 'none'
                }}
              >
                {el.type === 'text' ? (
                  <div style={{ width: '100%', whiteSpace: 'pre-wrap', pointerEvents: 'none' }}>{el.content}</div>
                ) : (
                  <div style={{ width: '100%', height: '100%', color: el.color, pointerEvents: 'none' }}>
                    {el.shapeType === 'rect' && <div style={{ width: '100%', height: '100%', background: 'currentColor' }}></div>}
                    {el.shapeType === 'circle' && <div style={{ width: '100%', height: '100%', background: 'currentColor', borderRadius: '50%' }}></div>}
                    {el.shapeType === 'triangle' && <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2z" /></svg>}
                    {['star', 'heart', 'zap'].includes(el.shapeType) && renderShapeIcon(el.shapeType, '100%')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>

        {/* --- Page Manager Strip (Bottom) --- */}
        <div style={{
          position: 'absolute', bottom: 20, left: 320 + 20, right: 320 + 20, // Adjust based on sidebar widths (approx)
          height: 80,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, pointerEvents: 'none' // Container is pass-through
        }}>
          <div style={{
            background: 'rgba(39, 39, 42, 0.9)', backdropFilter: 'blur(8px)',
            borderRadius: 16, padding: '8px 16px',
            display: 'flex', gap: 8, alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            pointerEvents: 'auto',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {pages.map((p, idx) => (
              <div
                key={p.id}
                onClick={() => setActivePageId(p.id)}
                style={{
                  width: 50, height: 60, borderRadius: 8,
                  background: p.id === activePageId ? '#8b5cf6' : '#3f3f46',
                  border: p.id === activePageId ? '2px solid white' : '1px solid transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden', flexShrink: 0
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 'bold', color: 'white' }}>{idx + 1}</span>
                {/* Delete Small Button */}
                <button
                  onClick={(e) => deletePage(e, p.id)}
                  style={{
                    position: 'absolute', top: 0, right: 0, padding: 2,
                    background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white',
                    cursor: 'pointer', display: pages.length > 1 && p.id === activePageId ? 'flex' : 'none'
                  }}
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}

            <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.1)', margin: '0 8px' }}></div>

            <button
              onClick={addPage}
              title="페이지 추가"
              style={{
                width: 40, height: 40, borderRadius: '50%', background: '#3f3f46',
                border: '1px solid rgba(255,255,255,0.1)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              className="hover:bg-zinc-600"
            >
              <Plus size={20} />
            </button>
            <button
              onClick={duplicatePage}
              title="페이지 복제"
              style={{
                width: 40, height: 40, borderRadius: '50%', background: '#3f3f46',
                border: '1px solid rgba(255,255,255,0.1)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              className="hover:bg-zinc-600"
            >
              <Copy size={18} />
            </button>
          </div>
        </div>

        {/* Hidden Export Container */}
        <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          {pages.map((p) => (
            <div
              key={p.id}
              ref={el => pageRefs.current[p.id] = el}
              style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, position: 'relative', overflow: 'hidden', backgroundColor: p.background.value }}
            >
              {/* Render Page Content for Export (Duplicate logic from main canvas) */}
              {p.background.bgImage && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `url(${p.background.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0, opacity: p.background.bgOpacity }} />
              )}
              {p.background.overlayImage && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  backgroundImage: `url(${p.background.overlayImage})`,
                  backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                  zIndex: 5,
                  opacity: p.background.overlayOpacity,
                  transform: `translate(${p.background.overlayX}px, ${p.background.overlayY}px) scale(${p.background.overlayScale})`
                }} />
              )}
              {p.elements.map(el => (
                <div key={el.id} style={{
                  position: 'absolute', left: el.x, top: el.y, width: el.width,
                  height: el.type === 'shape' ? el.height : 'auto',
                  fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.color, textAlign: el.align,
                  zIndex: 10, opacity: el.opacity, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {el.type === 'text' ? (
                    <div style={{ width: '100%', whiteSpace: 'pre-wrap' }}>{el.content}</div>
                  ) : (
                    <div style={{ width: '100%', height: '100%', color: el.color }}>
                      {el.shapeType === 'rect' && <div style={{ width: '100%', height: '100%', background: 'currentColor' }}></div>}
                      {el.shapeType === 'circle' && <div style={{ width: '100%', height: '100%', background: 'currentColor', borderRadius: '50%' }}></div>}
                      {el.shapeType === 'triangle' && <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2z" /></svg>}
                      {['star', 'heart', 'zap'].includes(el.shapeType) && renderShapeIcon(el.shapeType, '100%')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Right Panel: Properties */}
        <aside className={styles.rightPanel}>
          {selectedElement ? (
            <>
              <div className={styles.panelTitle}>속성 편집</div>
              <div className={styles.panelSection}>
                <div className={styles.propRow}>
                  <span className={styles.propLabel}>불투명도</span>
                  <div className={styles.sliderContainer}>
                    <input type="range" min="0" max="1" step="0.1" className={styles.rangeInput} value={selectedElement.opacity} onChange={(e) => updateElement(selectedElement.id, 'opacity', parseFloat(e.target.value))} />
                    <span style={{ fontSize: 12, width: 24, textAlign: 'right' }}>{Math.round(selectedElement.opacity * 100)}%</span>
                  </div>
                </div>
                <div className={styles.propRow}>
                  <span className={styles.propLabel}>색상</span>
                  <div className={styles.inputGroup}>
                    <input type="color" className={styles.colorPreview} value={selectedElement.color} onChange={(e) => updateElement(selectedElement.id, 'color', e.target.value)} style={{ width: 40, height: 36, padding: 0, border: 'none' }} />
                    <input type="text" className={styles.propInput} value={selectedElement.color} onChange={(e) => updateElement(selectedElement.id, 'color', e.target.value)} />
                  </div>
                </div>
              </div>

              {selectedElement.type === 'text' && (
                <div className={styles.panelSection}>
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>텍스트 내용</span>
                    <textarea className={styles.propInput} rows={4} value={selectedElement.content} onChange={(e) => updateElement(selectedElement.id, 'content', e.target.value)} />
                  </div>
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>폰트 크기</span>
                    <input type="number" className={styles.propInput} value={selectedElement.fontSize} onChange={(e) => updateElement(selectedElement.id, 'fontSize', parseInt(e.target.value))} />
                  </div>
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>정렬</span>
                    <div className={styles.alignGrid}>
                      <button onClick={() => updateElement(selectedElement.id, 'align', 'left')} className={`${styles.alignBtn} ${selectedElement.align === 'left' ? styles.alignBtnActive : ''}`}><AlignLeft size={16} /></button>
                      <button onClick={() => updateElement(selectedElement.id, 'align', 'center')} className={`${styles.alignBtn} ${selectedElement.align === 'center' ? styles.alignBtnActive : ''}`}><AlignCenter size={16} /></button>
                      <button onClick={() => updateElement(selectedElement.id, 'align', 'right')} className={`${styles.alignBtn} ${selectedElement.align === 'right' ? styles.alignBtnActive : ''}`}><AlignRight size={16} /></button>
                    </div>
                  </div>
                </div>
              )}

              {selectedElement.type === 'shape' && (
                <div className={styles.panelSection}>
                  <div className={styles.inputGroup}>
                    <div><div className={styles.propLabel}>너비</div><input type="number" className={styles.propInput} value={selectedElement.width} onChange={(e) => updateElement(selectedElement.id, 'width', parseInt(e.target.value))} /></div>
                    <div><div className={styles.propLabel}>높이</div><input type="number" className={styles.propInput} value={selectedElement.height} onChange={(e) => updateElement(selectedElement.id, 'height', parseInt(e.target.value))} /></div>
                  </div>
                </div>
              )}

              <div className={styles.panelSection}>
                <button className={styles.deleteButton} onClick={handleDelete}><Trash2 size={16} /> 요소 삭제</button>
              </div>
            </>
          ) : selectedId === 'overlay' ? (
            <>
              <div className={styles.panelTitle}>오버레이 편집</div>
              <div className={styles.panelSection}>
                <div className={styles.propRow}>
                  <span className={styles.propLabel}>오버레이 불투명도</span>
                  <div className={styles.sliderContainer}>
                    <input type="range" min="0" max="1" step="0.1" className={styles.rangeInput} value={background.overlayOpacity} onChange={(e) => setBackground({ ...background, overlayOpacity: parseFloat(e.target.value) })} />
                    <span style={{ fontSize: 12, width: 24, textAlign: 'right' }}>{Math.round(background.overlayOpacity * 100)}%</span>
                  </div>
                </div>
                <div className={styles.propRow}>
                  <span className={styles.propLabel}>크기 (배율)</span>
                  <div className={styles.sliderContainer}>
                    <input type="range" min="0.1" max="3" step="0.1" className={styles.rangeInput} value={background.overlayScale} onChange={(e) => setBackground({ ...background, overlayScale: parseFloat(e.target.value) })} />
                    <span style={{ fontSize: 12, width: 24, textAlign: 'right' }}>{background.overlayScale}x</span>
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <div><div className={styles.propLabel}>위치 X</div><input type="number" className={styles.propInput} value={Math.round(background.overlayX)} onChange={(e) => setBackground({ ...background, overlayX: parseInt(e.target.value) || 0 })} /></div>
                  <div><div className={styles.propLabel}>위치 Y</div><input type="number" className={styles.propInput} value={Math.round(background.overlayY)} onChange={(e) => setBackground({ ...background, overlayY: parseInt(e.target.value) || 0 })} /></div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525b', fontSize: 13, flexDirection: 'column', gap: 12 }}>
              <BoxSelect size={32} opacity={0.5} />
              <p>편집할 요소를 선택하거나</p>
              <p>배경을 클릭하세요</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
