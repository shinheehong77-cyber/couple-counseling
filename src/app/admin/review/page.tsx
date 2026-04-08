'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Annotation, ReviewPage } from '@/lib/review-store';
import type { FlowConnection } from '@/lib/review-store';
import {
  REVIEW_PAGES,
  ANNOTATION_TYPE_LABELS,
  ANNOTATION_TYPE_COLORS,
  DEFAULT_FLOW_CONNECTIONS,
  generateId,
  loadAnnotations,
  saveAnnotations,
  getPageAnnotations,
  exportAsMarkdown,
  loadPageOrder,
  savePageOrder,
  loadFlowConnections,
  saveFlowConnections,
} from '@/lib/review-store';

export default function ReviewToolPage() {
  const [selectedPageKey, setSelectedPageKey] = useState<string>('landing');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [isPlacingPin, setIsPlacingPin] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [annotationType, setAnnotationType] = useState<Annotation['type']>('general');
  const [showExport, setShowExport] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [filterType, setFilterType] = useState<Annotation['type'] | 'all'>('all');
  const [copySuccess, setCopySuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'flow' | 'review'>('flow');
  const [pageOrder, setPageOrder] = useState<string[]>(REVIEW_PAGES.map((p) => p.key));
  const [flowConnections, setFlowConnections] = useState<FlowConnection[]>(DEFAULT_FLOW_CONNECTIONS);
  const [draggedPageKey, setDraggedPageKey] = useState<string | null>(null);
  const [flowNotes, setFlowNotes] = useState<Record<string, string>>({});
  const [draggingPinId, setDraggingPinId] = useState<string | null>(null);
  const [iframeScale, setIframeScale] = useState(1);

  const overlayRef = useRef<HTMLDivElement>(null);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const IFRAME_FIXED_WIDTH = 375;
  const IFRAME_FIXED_HEIGHT = 812;

  const orderedPages = pageOrder
    .map((key) => REVIEW_PAGES.find((p) => p.key === key))
    .filter((p): p is ReviewPage => p !== undefined);

  const selectedPage = REVIEW_PAGES.find((p) => p.key === selectedPageKey) ?? REVIEW_PAGES[0];
  const pageAnnotations = getPageAnnotations(annotations, selectedPageKey);
  const filteredAnnotations =
    filterType === 'all' ? pageAnnotations : pageAnnotations.filter((a) => a.type === filterType);

  useEffect(() => {
    try {
      const loaded = loadAnnotations();
      const savedOrder = loadPageOrder();
      if (savedOrder) setPageOrder(savedOrder);
      const savedFlow = loadFlowConnections();
      setFlowConnections(savedFlow);
      setAnnotations(loaded);
    } catch (e) {
      console.error('Review tool init error:', e);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      saveAnnotations(annotations);
    }
  }, [annotations, mounted]);

  // Calculate scale to fit iframe in container
  useEffect(() => {
    if (!previewContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const scaleX = width / IFRAME_FIXED_WIDTH;
        const scaleY = height / IFRAME_FIXED_HEIGHT;
        setIframeScale(Math.min(scaleX, scaleY, 1.5));
      }
    });
    observer.observe(previewContainerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPlacingPin(false);
        setActiveAnnotationId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeAnnotation = annotations.find((a) => a.id === activeAnnotationId) ?? null;

  useEffect(() => {
    if (activeAnnotation) {
      setNoteText(activeAnnotation.note);
      setAnnotationType(activeAnnotation.type);
    }
  }, [activeAnnotationId]);

  // Convert screen coords to fixed iframe coords (percentage of fixed size)
  const screenToFixedPercent = useCallback(
    (clientX: number, clientY: number) => {
      if (!overlayRef.current) return null;
      const rect = overlayRef.current.getBoundingClientRect();
      const x = (clientX - rect.left) / iframeScale;
      const y = (clientY - rect.top) / iframeScale;
      return {
        xPercent: (x / IFRAME_FIXED_WIDTH) * 100,
        yPercent: (y / IFRAME_FIXED_HEIGHT) * 100,
      };
    },
    [iframeScale]
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isPlacingPin) return;
      const pos = screenToFixedPercent(e.clientX, e.clientY);
      if (!pos) return;

      const newAnnotation: Annotation = {
        id: generateId(),
        pageKey: selectedPageKey,
        xPercent: pos.xPercent,
        yPercent: pos.yPercent,
        type: 'general',
        note: '',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      setAnnotations((prev) => [...prev, newAnnotation]);
      setActiveAnnotationId(newAnnotation.id);
      setNoteText('');
      setAnnotationType('general');
      setIsPlacingPin(false);

      setTimeout(() => {
        noteTextareaRef.current?.focus();
      }, 50);
    },
    [isPlacingPin, selectedPageKey, screenToFixedPercent]
  );

  // Pin drag handlers
  const handlePinDragStart = useCallback(
    (e: React.MouseEvent, pinId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setDraggingPinId(pinId);

      const onMouseMove = (ev: MouseEvent) => {
        const pos = screenToFixedPercent(ev.clientX, ev.clientY);
        if (!pos) return;
        const clamped = {
          xPercent: Math.max(0, Math.min(100, pos.xPercent)),
          yPercent: Math.max(0, Math.min(100, pos.yPercent)),
        };
        setAnnotations((prev) =>
          prev.map((a) =>
            a.id === pinId ? { ...a, xPercent: clamped.xPercent, yPercent: clamped.yPercent } : a
          )
        );
      };

      const onMouseUp = () => {
        setDraggingPinId(null);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [screenToFixedPercent]
  );

  const handleSaveNote = useCallback(() => {
    if (!activeAnnotationId) return;
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === activeAnnotationId ? { ...a, note: noteText, type: annotationType } : a
      )
    );
  }, [activeAnnotationId, noteText, annotationType]);

  const handleDeleteAnnotation = useCallback(
    (id: string) => {
      setAnnotations((prev) => prev.filter((a) => a.id !== id));
      if (activeAnnotationId === id) {
        setActiveAnnotationId(null);
      }
    },
    [activeAnnotationId]
  );

  const handleToggleStatus = useCallback(() => {
    if (!activeAnnotationId) return;
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === activeAnnotationId
          ? { ...a, status: a.status === 'pending' ? 'applied' : 'pending' }
          : a
      )
    );
  }, [activeAnnotationId]);

  const handleDeleteAll = useCallback(() => {
    if (window.confirm('현재 페이지의 모든 어노테이션을 삭제하시겠습니까?')) {
      setAnnotations((prev) => prev.filter((a) => a.pageKey !== selectedPageKey));
      setActiveAnnotationId(null);
    }
  }, [selectedPageKey]);

  const handleDeleteAllGlobal = useCallback(() => {
    if (window.confirm('모든 페이지의 어노테이션을 전부 삭제하시겠습니까?')) {
      setAnnotations([]);
      setActiveAnnotationId(null);
    }
  }, []);

  const handleCopyMarkdown = useCallback(() => {
    const md = exportAsMarkdown(annotations);
    navigator.clipboard.writeText(md).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  }, [annotations]);

  // Flow drag-and-drop handlers
  const handleFlowDragStart = useCallback((pageKey: string) => {
    setDraggedPageKey(pageKey);
  }, []);

  const handleFlowDragOver = useCallback((e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (!draggedPageKey || draggedPageKey === targetKey) return;
    setPageOrder((prev) => {
      const newOrder = [...prev];
      const fromIdx = newOrder.indexOf(draggedPageKey);
      const toIdx = newOrder.indexOf(targetKey);
      if (fromIdx === -1 || toIdx === -1) return prev;
      newOrder.splice(fromIdx, 1);
      newOrder.splice(toIdx, 0, draggedPageKey);
      return newOrder;
    });
  }, [draggedPageKey]);

  const handleFlowDragEnd = useCallback(() => {
    setDraggedPageKey(null);
    savePageOrder(pageOrder);
  }, [pageOrder]);

  const handleGoToReview = useCallback((pageKey: string) => {
    setSelectedPageKey(pageKey);
    setViewMode('review');
    setIframeKey((k) => k + 1);
  }, []);

  const totalAnnotations = annotations.length;
  const totalPages = REVIEW_PAGES.filter((p) =>
    annotations.some((a) => a.pageKey === p.key)
  ).length;

  const styles = {
    root: {
      minHeight: '100vh',
      backgroundColor: '#1a1a2e',
      color: '#e8e8e8',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      display: 'flex',
      flexDirection: 'column' as const,
    },
    header: {
      backgroundColor: '#16213e',
      borderBottom: '1px solid #2a2a4a',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap' as const,
    },
    headerTitle: {
      fontSize: '18px',
      fontWeight: 700,
      color: '#D4A574',
      margin: 0,
    },
    headerSub: {
      fontSize: '13px',
      color: '#888',
      flex: 1,
    },
    btn: {
      padding: '7px 14px',
      borderRadius: '6px',
      border: '1px solid #2a2a4a',
      backgroundColor: '#1a1a2e',
      color: '#e8e8e8',
      cursor: 'pointer',
      fontSize: '13px',
      transition: 'all 0.15s',
    },
    btnActive: {
      backgroundColor: '#D4A574',
      color: '#1a1a2e',
      borderColor: '#D4A574',
      fontWeight: 600,
    },
    btnDanger: {
      borderColor: '#7a2020',
      color: '#f08080',
    },
    body: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
      flexDirection: 'row' as const,
    },
    leftPanel: {
      width: '200px',
      minWidth: '200px',
      backgroundColor: '#16213e',
      borderRight: '1px solid #2a2a4a',
      overflowY: 'auto' as const,
      padding: '8px 0',
    },
    pageItem: (selected: boolean) => ({
      padding: '10px 16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      borderLeft: selected ? '3px solid #D4A574' : '3px solid transparent',
      backgroundColor: selected ? '#1f2d4a' : 'transparent',
      fontSize: '13px',
      color: selected ? '#e8e8e8' : '#aaa',
      transition: 'all 0.15s',
    }),
    badge: (count: number) => ({
      backgroundColor: count > 0 ? '#D4A574' : '#2a2a4a',
      color: count > 0 ? '#1a1a2e' : '#666',
      borderRadius: '10px',
      padding: '1px 7px',
      fontSize: '11px',
      fontWeight: 600,
      minWidth: '20px',
      textAlign: 'center' as const,
    }),
    centerPanel: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      position: 'relative' as const,
      overflow: 'hidden',
    },
    previewContainer: {
      position: 'relative' as const,
      flex: 1,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#111',
    },
    iframeWrapper: {
      position: 'relative' as const,
      width: `${IFRAME_FIXED_WIDTH}px`,
      height: `${IFRAME_FIXED_HEIGHT}px`,
      transformOrigin: 'center center',
      transform: `scale(${iframeScale})`,
      flexShrink: 0,
    },
    iframe: {
      width: `${IFRAME_FIXED_WIDTH}px`,
      height: `${IFRAME_FIXED_HEIGHT}px`,
      border: 'none',
      display: 'block',
      borderRadius: '12px',
    },
    overlay: (placing: boolean) => ({
      position: 'absolute' as const,
      inset: 0,
      cursor: placing ? 'crosshair' : 'default',
      pointerEvents: placing ? ('auto' as const) : ('none' as const),
      backgroundColor: placing ? 'rgba(212,165,116,0.05)' : 'transparent',
      borderRadius: '12px',
    }),
    pinsLayer: {
      position: 'absolute' as const,
      inset: 0,
      pointerEvents: 'none' as const,
    },
    pin: (active: boolean, color: string, dragging: boolean) => ({
      position: 'absolute' as const,
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      backgroundColor: color,
      border: `2px solid ${active ? '#fff' : 'rgba(255,255,255,0.5)'}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      fontWeight: 700,
      color: '#fff',
      cursor: dragging ? 'grabbing' : 'grab',
      pointerEvents: 'auto' as const,
      transform: 'translate(-50%, -50%)',
      boxShadow: active ? '0 0 0 3px rgba(212,165,116,0.5)' : '0 2px 6px rgba(0,0,0,0.4)',
      zIndex: active || dragging ? 10 : 5,
      transition: dragging ? 'none' : 'box-shadow 0.2s',
    }),
    rightPanel: {
      width: '320px',
      minWidth: '320px',
      backgroundColor: '#16213e',
      borderLeft: '1px solid #2a2a4a',
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
    },
    rightHeader: {
      padding: '12px 16px',
      borderBottom: '1px solid #2a2a4a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rightTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#e8e8e8',
    },
    filterRow: {
      padding: '8px 12px',
      display: 'flex',
      gap: '4px',
      flexWrap: 'wrap' as const,
      borderBottom: '1px solid #2a2a4a',
    },
    filterBtn: (active: boolean) => ({
      padding: '3px 10px',
      borderRadius: '12px',
      border: '1px solid #2a2a4a',
      backgroundColor: active ? '#D4A574' : 'transparent',
      color: active ? '#1a1a2e' : '#888',
      cursor: 'pointer',
      fontSize: '11px',
      fontWeight: active ? 600 : 400,
    }),
    annotationList: {
      flex: 1,
      overflowY: 'auto' as const,
    },
    annotationItem: (active: boolean) => ({
      padding: '10px 14px',
      borderBottom: '1px solid #1a1a2e',
      cursor: 'pointer',
      backgroundColor: active ? '#1f2d4a' : 'transparent',
      borderLeft: active ? '3px solid #D4A574' : '3px solid transparent',
      transition: 'all 0.15s',
    }),
    annotationItemRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '4px',
    },
    indexNum: {
      fontSize: '11px',
      color: '#666',
      minWidth: '20px',
    },
    dot: (color: string) => ({
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: color,
      flexShrink: 0,
    }),
    typeBadgeText: {
      fontSize: '11px',
      color: '#aaa',
    },
    statusChip: (status: string) => ({
      marginLeft: 'auto',
      padding: '1px 6px',
      borderRadius: '8px',
      fontSize: '10px',
      backgroundColor: status === 'applied' ? '#1a4a1a' : '#3a2a1a',
      color: status === 'applied' ? '#4caf50' : '#D4A574',
    }),
    notePreview: {
      fontSize: '12px',
      color: '#ccc',
      paddingLeft: '28px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
      maxWidth: '260px',
    },
    editForm: {
      borderTop: '2px solid #D4A574',
      padding: '14px',
      backgroundColor: '#111827',
    },
    editFormTitle: {
      fontSize: '12px',
      color: '#D4A574',
      fontWeight: 600,
      marginBottom: '10px',
    },
    typeRadioRow: {
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap' as const,
      marginBottom: '10px',
    },
    typeRadio: (selected: boolean, color: string) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      padding: '4px 9px',
      borderRadius: '12px',
      border: `1px solid ${selected ? color : '#2a2a4a'}`,
      backgroundColor: selected ? `${color}22` : 'transparent',
      cursor: 'pointer',
      fontSize: '11px',
      color: selected ? color : '#888',
    }),
    textarea: {
      width: '100%',
      minHeight: '80px',
      backgroundColor: '#1a1a2e',
      border: '1px solid #2a2a4a',
      borderRadius: '6px',
      color: '#e8e8e8',
      padding: '8px',
      fontSize: '13px',
      resize: 'vertical' as const,
      outline: 'none',
      boxSizing: 'border-box' as const,
      fontFamily: 'inherit',
      marginBottom: '10px',
    },
    formBtnRow: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
    },
    modalOverlay: {
      position: 'fixed' as const,
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: '#16213e',
      border: '1px solid #2a2a4a',
      borderRadius: '12px',
      width: '90%',
      maxWidth: '640px',
      maxHeight: '80vh',
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
    },
    modalHeader: {
      padding: '16px 20px',
      borderBottom: '1px solid #2a2a4a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalTitle: {
      fontSize: '16px',
      fontWeight: 700,
      color: '#D4A574',
    },
    pre: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '16px 20px',
      margin: 0,
      fontSize: '12px',
      color: '#ccc',
      backgroundColor: '#0d1117',
      whiteSpace: 'pre-wrap' as const,
      wordBreak: 'break-word' as const,
      fontFamily: "'Courier New', monospace",
    },
    modalFooter: {
      padding: '12px 20px',
      borderTop: '1px solid #2a2a4a',
      display: 'flex',
      gap: '8px',
      justifyContent: 'flex-end',
    },
    emptyState: {
      padding: '32px 16px',
      textAlign: 'center' as const,
      color: '#555',
      fontSize: '13px',
    },
  };

  if (!mounted) {
    return (
      <div style={{ ...styles.root, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#D4A574', fontSize: '16px' }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>화면 리뷰 도구</h1>
        <div style={{ display: 'flex', gap: '2px', backgroundColor: '#1a1a2e', borderRadius: '8px', padding: '2px' }}>
          <button
            style={{ ...styles.btn, borderRadius: '6px', ...(viewMode === 'flow' ? styles.btnActive : {}) }}
            onClick={() => setViewMode('flow')}
          >
            🗺 플로우
          </button>
          <button
            style={{ ...styles.btn, borderRadius: '6px', ...(viewMode === 'review' ? styles.btnActive : {}) }}
            onClick={() => setViewMode('review')}
          >
            🔍 리뷰
          </button>
        </div>
        <span style={styles.headerSub}>
          {totalAnnotations}개의 어노테이션 · {totalPages}개 페이지
        </span>
        {viewMode === 'review' && (
          <>
            <button
              style={{ ...styles.btn, ...(isPlacingPin ? styles.btnActive : {}) }}
              onClick={() => setIsPlacingPin((v) => !v)}
            >
              📌 핀 추가
            </button>
            <button
              style={{ ...styles.btn, ...styles.btnDanger }}
              onClick={handleDeleteAll}
            >
              🗑 삭제
            </button>
          </>
        )}
        <button style={styles.btn} onClick={() => setShowExport(true)}>
          📋 내보내기
        </button>
        <button
          style={{ ...styles.btn, ...styles.btnDanger }}
          onClick={handleDeleteAllGlobal}
        >
          🗑 전체 삭제
        </button>
      </div>

      {/* Flow View */}
      {viewMode === 'flow' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {/* Flow description */}
          <div style={{ textAlign: 'center', marginBottom: '24px', color: '#888', fontSize: '13px' }}>
            드래그하여 순서를 변경하세요 · 카드를 클릭하면 해당 페이지 리뷰로 이동합니다
          </div>

          {/* Flow grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px',
            maxWidth: '1200px',
            margin: '0 auto',
          }}>
            {orderedPages.map((page, idx) => {
              const count = annotations.filter((a) => a.pageKey === page.key).length;
              const isDragging = draggedPageKey === page.key;
              const connections = flowConnections.filter((c) => c.from === page.key);
              const incomingConnections = flowConnections.filter((c) => c.to === page.key);

              return (
                <div
                  key={page.key}
                  draggable
                  onDragStart={() => handleFlowDragStart(page.key)}
                  onDragOver={(e) => handleFlowDragOver(e, page.key)}
                  onDragEnd={handleFlowDragEnd}
                  style={{
                    backgroundColor: isDragging ? '#2a3a5e' : '#16213e',
                    border: `1px solid ${isDragging ? '#D4A574' : '#2a2a4a'}`,
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'grab',
                    opacity: isDragging ? 0.7 : 1,
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                >
                  {/* Order number */}
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '-8px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#D4A574',
                    color: '#1a1a2e',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {idx + 1}
                  </div>

                  {/* Annotation badge */}
                  {count > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      backgroundColor: '#D4A574',
                      color: '#1a1a2e',
                      fontSize: '10px',
                      fontWeight: 700,
                    }}>
                      {count}개 메모
                    </div>
                  )}

                  {/* Page name */}
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#e8e8e8', marginBottom: '4px' }}>
                    {page.label}
                  </div>

                  {/* Path */}
                  <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace', marginBottom: '8px' }}>
                    {page.path}
                  </div>

                  {/* Description */}
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>
                    {page.description}
                  </div>

                  {/* Outgoing connections */}
                  {connections.length > 0 && (
                    <div style={{ fontSize: '11px', color: '#555', marginBottom: '10px' }}>
                      <span style={{ color: '#D4A574' }}>→</span>{' '}
                      {connections.map((c) => {
                        const target = REVIEW_PAGES.find((p) => p.key === c.to);
                        return target ? `${target.label}${c.label ? ` (${c.label})` : ''}` : '';
                      }).filter(Boolean).join(', ')}
                    </div>
                  )}

                  {/* Incoming connections */}
                  {incomingConnections.length > 0 && (
                    <div style={{ fontSize: '11px', color: '#555', marginBottom: '10px' }}>
                      <span style={{ color: '#A5D4BC' }}>←</span>{' '}
                      {incomingConnections.map((c) => {
                        const source = REVIEW_PAGES.find((p) => p.key === c.from);
                        return source ? source.label : '';
                      }).filter(Boolean).join(', ')}
                    </div>
                  )}

                  {/* Review button */}
                  <button
                    style={{
                      ...styles.btn,
                      width: '100%',
                      fontSize: '12px',
                      padding: '6px',
                      marginTop: '4px',
                      textAlign: 'center',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGoToReview(page.key);
                    }}
                  >
                    리뷰하기 →
                  </button>
                </div>
              );
            })}
          </div>

          {/* Flow summary */}
          <div style={{
            maxWidth: '1200px',
            margin: '32px auto 0',
            padding: '20px',
            backgroundColor: '#16213e',
            borderRadius: '12px',
            border: '1px solid #2a2a4a',
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#D4A574', marginBottom: '12px' }}>
              사용자 여정 요약
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {orderedPages.map((page, idx) => (
                <div key={page.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #2a2a4a',
                    fontSize: '12px',
                    color: '#e8e8e8',
                  }}>
                    {page.label}
                  </span>
                  {idx < orderedPages.length - 1 && (
                    <span style={{ color: '#555', fontSize: '14px' }}>→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Review View */}
      {viewMode === 'review' && (
      <div style={styles.body}>
        {/* Left: Page List */}
        <div style={styles.leftPanel}>
          {orderedPages.map((page) => {
            const count = annotations.filter((a) => a.pageKey === page.key).length;
            return (
              <div
                key={page.key}
                style={styles.pageItem(page.key === selectedPageKey)}
                onClick={() => {
                  setSelectedPageKey(page.key);
                  setActiveAnnotationId(null);
                  setIframeKey((k) => k + 1);
                  setFilterType('all');
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {page.label}
                </span>
                <span style={styles.badge(count)}>{count}</span>
              </div>
            );
          })}
        </div>

        {/* Center: Preview */}
        <div style={styles.centerPanel}>
          <div ref={previewContainerRef} style={styles.previewContainer}>
            <div style={styles.iframeWrapper}>
              <iframe
                key={iframeKey}
                src={`${window.location.origin}${selectedPage.path}`}
                style={styles.iframe}
                title={selectedPage.label}
              />

              {/* Pins layer (always visible, non-blocking unless placing) */}
              <div style={styles.pinsLayer}>
                {pageAnnotations.map((ann, idx) => (
                  <div
                    key={ann.id}
                    style={{
                      ...styles.pin(
                        ann.id === activeAnnotationId,
                        ANNOTATION_TYPE_COLORS[ann.type],
                        ann.id === draggingPinId
                      ),
                      left: `${ann.xPercent}%`,
                      top: `${ann.yPercent}%`,
                    }}
                    onMouseDown={(e) => handlePinDragStart(e, ann.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveAnnotationId(ann.id);
                      setNoteText(ann.note);
                      setAnnotationType(ann.type);
                    }}
                    title={ann.note || ANNOTATION_TYPE_LABELS[ann.type]}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>

              {/* Click overlay for pin placement */}
              <div
                ref={overlayRef}
                style={styles.overlay(isPlacingPin)}
                onClick={handleOverlayClick}
              />
            </div>
          </div>

          {isPlacingPin && (
            <div
              style={{
                padding: '8px 16px',
                backgroundColor: '#D4A574',
                color: '#1a1a2e',
                fontSize: '13px',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              클릭하여 핀을 추가하세요 · ESC로 취소
            </div>
          )}
        </div>

        {/* Right: Annotations */}
        <div style={styles.rightPanel}>
          <div style={styles.rightHeader}>
            <span style={styles.rightTitle}>어노테이션</span>
            <span style={{ fontSize: '12px', color: '#888' }}>{pageAnnotations.length}개</span>
          </div>

          {/* Filter */}
          <div style={styles.filterRow}>
            {(['all', 'text', 'design', 'layout', 'general'] as const).map((f) => (
              <button
                key={f}
                style={styles.filterBtn(filterType === f)}
                onClick={() => setFilterType(f)}
              >
                {f === 'all' ? '전체' : ANNOTATION_TYPE_LABELS[f]}
              </button>
            ))}
          </div>

          {/* Annotation List */}
          <div style={styles.annotationList}>
            {filteredAnnotations.length === 0 ? (
              <div style={styles.emptyState}>
                {pageAnnotations.length === 0
                  ? '핀 추가 버튼으로 어노테이션을 추가하세요'
                  : '해당 유형의 어노테이션이 없습니다'}
              </div>
            ) : (
              filteredAnnotations.map((ann, idx) => {
                const globalIdx = pageAnnotations.findIndex((a) => a.id === ann.id);
                const color = ANNOTATION_TYPE_COLORS[ann.type];
                const isActive = ann.id === activeAnnotationId;
                return (
                  <div
                    key={ann.id}
                    style={styles.annotationItem(isActive)}
                    onClick={() => {
                      setActiveAnnotationId(ann.id);
                      setNoteText(ann.note);
                      setAnnotationType(ann.type);
                    }}
                  >
                    <div style={styles.annotationItemRow}>
                      <span style={styles.indexNum}>#{globalIdx + 1}</span>
                      <span style={styles.dot(color)} />
                      <span style={styles.typeBadgeText}>{ANNOTATION_TYPE_LABELS[ann.type]}</span>
                      <span style={styles.statusChip(ann.status)}>
                        {ann.status === 'applied' ? '완료' : '대기'}
                      </span>
                    </div>
                    <div style={styles.notePreview}>
                      {ann.note || <span style={{ color: '#555' }}>메모 없음</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Edit Form */}
          {activeAnnotation && (
            <div style={styles.editForm}>
              <div style={styles.editFormTitle}>어노테이션 편집</div>

              {/* Type selector */}
              <div style={styles.typeRadioRow}>
                {(['text', 'design', 'layout', 'general'] as Annotation['type'][]).map((t) => {
                  const color = ANNOTATION_TYPE_COLORS[t];
                  return (
                    <div
                      key={t}
                      style={styles.typeRadio(annotationType === t, color)}
                      onClick={() => {
                        setAnnotationType(t);
                        setAnnotations((prev) =>
                          prev.map((a) =>
                            a.id === activeAnnotationId ? { ...a, type: t } : a
                          )
                        );
                      }}
                    >
                      <span style={styles.dot(color)} />
                      {ANNOTATION_TYPE_LABELS[t]}
                    </div>
                  );
                })}
              </div>

              {/* Note textarea */}
              <textarea
                ref={noteTextareaRef}
                style={styles.textarea}
                value={noteText}
                placeholder="수정사항을 입력하세요..."
                onChange={(e) => setNoteText(e.target.value)}
                onBlur={handleSaveNote}
              />

              {/* Actions */}
              <div style={styles.formBtnRow}>
                <button
                  style={{
                    ...styles.btn,
                    fontSize: '12px',
                    padding: '5px 12px',
                    backgroundColor:
                      activeAnnotation.status === 'applied' ? '#1a4a1a' : '#3a2a1a',
                    borderColor:
                      activeAnnotation.status === 'applied' ? '#4caf50' : '#D4A574',
                    color:
                      activeAnnotation.status === 'applied' ? '#4caf50' : '#D4A574',
                  }}
                  onClick={handleToggleStatus}
                >
                  {activeAnnotation.status === 'applied' ? '✓ 완료됨' : '○ 대기중'}
                </button>
                <button
                  style={{ ...styles.btn, fontSize: '12px', padding: '5px 12px' }}
                  onClick={handleSaveNote}
                >
                  저장
                </button>
                <button
                  style={{
                    ...styles.btn,
                    ...styles.btnDanger,
                    fontSize: '12px',
                    padding: '5px 12px',
                    marginLeft: 'auto',
                  }}
                  onClick={() => handleDeleteAnnotation(activeAnnotation.id)}
                >
                  삭제
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Export Modal */}
      {showExport && (
        <div style={styles.modalOverlay} onClick={() => setShowExport(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>마크다운 내보내기</span>
            </div>
            <pre style={styles.pre}>{exportAsMarkdown(annotations)}</pre>
            <div style={styles.modalFooter}>
              <button style={styles.btn} onClick={handleCopyMarkdown}>
                {copySuccess ? '✓ 복사됨' : '📋 복사'}
              </button>
              <button style={styles.btn} onClick={() => setShowExport(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
