import { useState, useEffect, useRef, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import { Editor } from '@tinymce/tinymce-react';
import { getImgUrl } from '../../utils/helpers';

/* ────────────────────────────────────────────────────────── helpers */
const getImgSrc = (src) => {
  if (!src) return null;
  if (src.startsWith('blob:') || src.startsWith('http')) return src;
  return getImgUrl(src);
};

const statusMap = {
  draft:     { label: 'Bản nháp',  color: '#92400e', bg: '#fef9c3', border: '#fde68a' },
  published: { label: 'Đã đăng',   color: '#065f46', bg: '#d1fae5', border: '#6ee7b7' },
};

/** Đếm ký tự và trả màu indicator */
const CharCounter = ({ value = '', max, warn = 0.8 }) => {
  const len   = value.length;
  const ratio = len / max;
  const color = len > max ? '#ef4444' : ratio >= warn ? '#f59e0b' : '#10b981';
  return (
    <span style={{ fontSize: 11, color, fontWeight: 600, marginLeft: 6 }}>
      {len}/{max}
    </span>
  );
};

/** SEO Preview giống Google SERP */
const SeoPreview = ({ title, description, slug }) => {
  const displayTitle = title || '(Chưa có tiêu đề)';
  const displayDesc  = description || '(Chưa có mô tả)';
  const url          = `yoursite.com/tin-tuc/${slug || 'duong-dan-bai-viet'}`;
  return (
    <div style={{
      border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px',
      background: '#fff', fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{ fontSize: 11, color: '#5f6368', marginBottom: 2 }}>
        {url}
      </div>
      <div style={{
        fontSize: 18, color: '#1a0dab', fontWeight: 400,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        maxWidth: 550,
      }}>
        {displayTitle.slice(0, 60)}{displayTitle.length > 60 ? '…' : ''}
      </div>
      <div style={{
        fontSize: 13, color: '#4d5156', marginTop: 4,
        display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
        maxWidth: 580,
      }}>
        {displayDesc}
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────── component */
const emptyForm = {
  title: '', content: '', excerpt: '', status: 'draft', category_post_id: '',
  meta_title: '', meta_description: '', meta_keywords: '', canonical_url: '',
  published_at: '',
};

const PostManagement = () => {
  const [posts, setPosts]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [editItem, setEditItem]       = useState(null);
  const [saving, setSaving]           = useState(false);
  const [categories, setCategories]   = useState([]);
  const [page, setPage]               = useState(1);
  const [meta, setMeta]               = useState({});
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [catFilter, setCatFilter]     = useState('');
  const [form, setForm]               = useState(emptyForm);
  const [errors, setErrors]           = useState({});
  const [activeTab, setActiveTab]     = useState('content'); // 'content' | 'seo'
  const [thumbFile, setThumbFile]     = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [ogFile, setOgFile]           = useState(null);
  const [ogPreview, setOgPreview]     = useState(null);
  const thumbRef = useRef();
  const ogRef    = useRef();

  /* Tự tính slug preview từ title */
  const slugPreview = form.meta_title
    ? form.meta_title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    : form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  /* ── Fetch ── */
  const fetchPosts = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const res = await adminApi.getPosts({ page: p, search, status: statusFilter, category_post_id: catFilter });
      setPosts(res?.data || (Array.isArray(res) ? res : []));
      setMeta(res?.meta || { current_page: res?.current_page, last_page: res?.last_page } || {});
    } catch { /* silent */ } finally { setLoading(false); }
  }, [search, statusFilter, catFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchPosts(page), 400);
    return () => clearTimeout(t);
  }, [page, fetchPosts]);

  useEffect(() => {
    adminApi.getPostCategories().then(r => setCategories(r.data || r || [])).catch(() => {});
  }, []);

  /* ── Modal helpers ── */
  const openCreate = () => {
    setEditItem(null); setForm(emptyForm); setErrors({});
    setThumbFile(null); setThumbPreview(null);
    setOgFile(null); setOgPreview(null);
    setActiveTab('content'); setShowModal(true);
  };

  const openEdit = (post) => {
    setEditItem(post);
    setForm({
      title:             post.title || '',
      content:           post.content || '',
      excerpt:           post.excerpt || '',
      status:            post.status || 'draft',
      category_post_id:  post.category_post_id || '',
      meta_title:        post.meta_title || '',
      meta_description:  post.meta_description || '',
      meta_keywords:     post.meta_keywords || '',
      canonical_url:     post.canonical_url || '',
      published_at:      post.published_at ? post.published_at.slice(0, 16) : '',
    });
    setErrors({});
    setThumbFile(null); setThumbPreview(post.thumbnail || null);
    setOgFile(null);    setOgPreview(post.og_image || null);
    setActiveTab('content'); setShowModal(true);
  };

  /* ── Validate client-side (mirror backend rules) ── */
  const validate = () => {
    const e = {};
    if (!form.title.trim())               e.title = 'Tiêu đề là bắt buộc.';
    const textContent = form.content.replace(/<[^>]+>/g, '').trim();
    if (!form.content.trim())             e.content = 'Nội dung là bắt buộc.';
    else if (textContent.length < 50)
      e.content = 'Nội dung phải có ít nhất 50 ký tự.';
    if (form.meta_title.length > 60)      e.meta_title = 'Meta Title tối đa 60 ký tự.';
    if (form.meta_description.length > 160)
      e.meta_description = 'Meta Description tối đa 160 ký tự.';
    if (form.excerpt.length > 300)        e.excerpt = 'Tóm tắt tối đa 300 ký tự.';
    if (form.canonical_url && !/^https?:\/\/.+/.test(form.canonical_url))
      e.canonical_url = 'Canonical URL phải bắt đầu bằng http:// hoặc https://';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Save ── */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) {
      // Nếu có lỗi SEO, tự chuyển sang tab SEO
      if (errors.meta_title || errors.meta_description || errors.canonical_url) setActiveTab('seo');
      return;
    }
    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      if (thumbFile) fd.append('thumbnail', thumbFile);
      if (ogFile)    fd.append('og_image', ogFile);
      // Laravel PUT qua FormData cần _method
      if (editItem) {
        fd.append('_method', 'PUT');
        await adminApi.updatePost(editItem.id, fd);
      } else {
        await adminApi.createPost(fd);
      }
      setShowModal(false);
      fetchPosts(page);
    } catch (err) {
      const serverErrors = err.response?.data?.errors || {};
      if (Object.keys(serverErrors).length) {
        setErrors(serverErrors);
        if (serverErrors.meta_title || serverErrors.meta_description || serverErrors.canonical_url)
          setActiveTab('seo');
      } else {
        alert(err.response?.data?.message || 'Có lỗi xảy ra');
      }
    } finally { setSaving(false); }
  };

  const handleToggleStatus = async (post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      const fd = new FormData();
      fd.append('title',   post.title);
      fd.append('content', post.content || '');
      fd.append('status',  newStatus);
      fd.append('_method', 'PUT');
      await adminApi.updatePost(post.id, fd);
      fetchPosts(page);
    } catch { alert('Không thể thay đổi trạng thái'); }
  };

  const handleDelete = async (post) => {
    if (!window.confirm(`Xóa bài viết "${post.title}"?`)) return;
    try {
      await adminApi.deletePost(post.id);
      fetchPosts(page);
    } catch { alert('Không thể xóa bài viết'); }
  };

  /* ── File handlers ── */
  const handleThumb = (e) => {
    const f = e.target.files[0]; if (!f) return;
    if (thumbPreview?.startsWith('blob:')) URL.revokeObjectURL(thumbPreview);
    setThumbFile(f); setThumbPreview(URL.createObjectURL(f));
  };
  const handleOg = (e) => {
    const f = e.target.files[0]; if (!f) return;
    if (ogPreview?.startsWith('blob:')) URL.revokeObjectURL(ogPreview);
    setOgFile(f); setOgPreview(URL.createObjectURL(f));
  };

  const set = (key) => (e) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

  /* ── Render ── */
  const tabStyle = (tab) => ({
    padding: '8px 16px', border: 'none', cursor: 'pointer',
    fontWeight: 600, fontSize: 13, borderRadius: '6px 6px 0 0',
    background: activeTab === tab ? '#fff' : '#f1f5f9',
    color: activeTab === tab ? 'var(--color-primary)' : '#64748b',
    borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
  });

  const fieldStyle = (key) => ({
    className: 'form-input',
    style: { borderColor: errors[key] ? '#ef4444' : undefined },
  });

  return (
    <div className="management-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Quản lý Tin tức</h1>
        <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="bi bi-plus-lg" />
          Thêm Bài viết
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input type="text" placeholder="Tìm tiêu đề, mô tả..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="form-input" style={{ width: 280 }} />
        <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
          className="form-input" style={{ width: 180 }}>
          <option value="">Tất cả Danh mục</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="form-input" style={{ width: 160 }}>
          <option value="">Tất cả Trạng thái</option>
          <option value="published">Đã đăng</option>
          <option value="draft">Bản nháp</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th><th>Ảnh</th><th>Tiêu đề &amp; SEO</th>
              <th>Danh mục</th><th>Tác giả</th><th>Trạng thái</th>
              <th>Ngày đăng</th><th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                  <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                ))}</tr>
              ))
              : posts.map(post => {
                const st = statusMap[post.status] || statusMap.draft;
                const hasSeo = post.meta_title && post.meta_description;
                return (
                  <tr key={post.id}>
                    <td>#{post.id}</td>
                    <td>
                      {post.thumbnail
                        ? <img src={getImgSrc(post.thumbnail)} alt={post.title}
                            style={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                        : <div style={{ width: 72, height: 48, background: '#f1f5f9', borderRadius: 6,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📰</div>
                      }
                    </td>
                    <td style={{ maxWidth: 260 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{post.title}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2, fontStyle: 'italic' }}>
                        /{post.slug}
                      </div>
                      {hasSeo
                        ? <span style={{ fontSize: 10, background: '#d1fae5', color: '#065f46',
                            padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>✅ SEO OK</span>
                        : <span style={{ fontSize: 10, background: '#fee2e2', color: '#991b1b',
                            padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>⚠ Chưa có SEO</span>
                      }
                      {post.reading_time && (
                        <span style={{ fontSize: 10, background: '#ede9fe', color: '#5b21b6',
                          padding: '1px 6px', borderRadius: 10, marginLeft: 4 }}>
                          ⏱ {post.reading_time} phút đọc
                        </span>
                      )}
                    </td>
                    <td style={{ color: '#6b7280', fontSize: 13 }}>{post.category?.name || '—'}</td>
                    <td style={{ color: '#6b7280', fontSize: 13 }}>{post.author?.name || '—'}</td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px',
                        borderRadius: 20, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{formatDate(post.published_at || post.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button className="action-btn action-btn-edit" onClick={() => openEdit(post)}>Sửa</button>
                        <button className="action-btn"
                          style={{ background: post.status === 'published' ? '#fef9c3' : '#d1fae5',
                            color: post.status === 'published' ? '#92400e' : '#065f46',
                            border: `1px solid ${post.status === 'published' ? '#fde68a' : '#6ee7b7'}` }}
                          onClick={() => handleToggleStatus(post)}>
                          {post.status === 'published' ? 'Rút xuống' : 'Đăng'}
                        </button>
                        <button className="action-btn"
                          style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
                          onClick={() => handleDelete(post)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            }
            {!loading && posts.length === 0 && (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
                Chưa có bài viết nào
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
          {Array.from({ length: meta.last_page }).map((_, i) => (
            <button key={i + 1} onClick={() => setPage(i + 1)}
              className={`pagination__page${page === i + 1 ? ' active' : ''}`}>{i + 1}</button>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════ Modal ════════════════════ */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 999,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: '24px 16px', overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 800,
            boxShadow: '0 20px 60px rgba(0,0,0,.25)', marginBottom: 32 }}>

            {/* Header */}
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #e5e7eb',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                {editItem ? '✏️ Sửa bài viết' : '📝 Thêm bài viết mới'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none',
                fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', padding: '0 28px', gap: 4, borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
              <button style={tabStyle('content')} onClick={() => setActiveTab('content')}>📄 Nội dung</button>
              <button style={tabStyle('seo')} onClick={() => setActiveTab('seo')}>
                🔍 SEO
                {(errors.meta_title || errors.meta_description || errors.canonical_url) && (
                  <span style={{ marginLeft: 6, background: '#ef4444', color: '#fff',
                    borderRadius: '50%', width: 16, height: 16, display: 'inline-flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>!</span>
                )}
              </button>
              <button style={tabStyle('thumbnail')} onClick={() => setActiveTab('thumbnail')}>🖼️ Ảnh</button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ padding: '24px 28px' }}>

                {/* ═══ TAB CONTENT ═══ */}
                {activeTab === 'content' && (
                  <div>
                    {/* Tiêu đề */}
                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label">Tiêu đề bài viết *</label>
                      <input className="form-input" value={form.title} onChange={set('title')}
                        placeholder="VD: 5 bí quyết chăm sóc da mặt hiệu quả tại nhà"
                        style={{ borderColor: errors.title ? '#ef4444' : undefined }} />
                      {errors.title && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.title}</p>}
                      <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>
                        Tiêu đề nên có 50–60 ký tự để tối ưu SEO
                        <CharCounter value={form.title} max={60} />
                      </p>
                    </div>

                    {/* Category + Status */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                      <div className="form-group">
                        <label className="form-label">Danh mục</label>
                        <select className="form-select" value={form.category_post_id} onChange={set('category_post_id')}>
                          <option value="">-- Không phân loại --</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Trạng thái</label>
                        <select className="form-select" value={form.status} onChange={set('status')}>
                          <option value="draft">Bản nháp</option>
                          <option value="published">Đăng ngay</option>
                        </select>
                      </div>
                    </div>

                    {/* Tóm tắt */}
                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label">
                        Tóm tắt (Excerpt)
                        <CharCounter value={form.excerpt} max={300} warn={0.85} />
                      </label>
                      <textarea className="form-textarea" rows={2} value={form.excerpt} onChange={set('excerpt')}
                        placeholder="Tóm tắt ngắn hiển thị ở danh sách bài viết. Để trống sẽ tự lấy từ nội dung."
                        style={{ borderColor: errors.excerpt ? '#ef4444' : undefined }} />
                      {errors.excerpt && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.excerpt}</p>}
                    </div>

                    {/* Nội dung */}
                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label">Nội dung *</label>
                      <div style={{ border: errors.content ? '1px solid #ef4444' : 'none', borderRadius: 4, overflow: 'hidden' }}>
                        <Editor
                          apiKey={import.meta.env.VITE_TINYMCE_API_KEY || '0vku09w6tdbawpejdkd4gm8y4bs2ggz459qs2yabuz8zeccr'}
                          value={form.content}
                          onEditorChange={(content) => {
                            setForm(prev => ({ ...prev, content }));
                            if (errors.content) setErrors(prev => ({ ...prev, content: '' }));
                          }}
                          init={{
                            height: 400,
                            menubar: false,
                            plugins: [
                              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                              'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                            ],
                            toolbar: 'undo redo | blocks | ' +
                              'bold italic forecolor | alignleft aligncenter ' +
                              'alignright alignjustify | bullist numlist outdent indent | ' +
                              'removeformat | image | help',
                            content_style: 'body { font-family:Inter,Arial,sans-serif; font-size:14px }'
                          }}
                        />
                      </div>
                      {errors.content && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.content}</p>}
                      <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>
                        {form.content.replace(/<[^>]+>/g, '').trim().length} ký tự
                        {form.content.trim().length > 0 && ` • ~${Math.ceil(form.content.replace(/<[^>]+>/g, '').trim().split(/\s+/).length / 200)} phút đọc`}
                      </p>
                    </div>

                    {/* Ngày đăng */}
                    <div className="form-group">
                      <label className="form-label">Ngày đăng (tuỳ chọn)</label>
                      <input type="datetime-local" className="form-input" value={form.published_at} onChange={set('published_at')} />
                      <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>
                        Để trống sẽ dùng thời điểm bạn bấm Lưu.
                      </p>
                    </div>
                  </div>
                )}

                {/* ═══ TAB SEO ═══ */}
                {activeTab === 'seo' && (
                  <div>
                    {/* Google Preview */}
                    <div style={{ marginBottom: 20 }}>
                      <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
                        📊 Xem trước trên Google
                      </label>
                      <SeoPreview
                        title={form.meta_title || form.title}
                        description={form.meta_description || form.excerpt}
                        slug={slugPreview}
                      />
                    </div>

                    {/* Meta Title */}
                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label">
                        Meta Title (SEO)
                        <CharCounter value={form.meta_title} max={60} />
                      </label>
                      <input className="form-input" value={form.meta_title} onChange={set('meta_title')}
                        placeholder={`Để trống sẽ dùng: "${form.title.slice(0, 55)}..."`}
                        style={{ borderColor: errors.meta_title ? '#ef4444' : undefined }} />
                      {errors.meta_title
                        ? <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.meta_title}</p>
                        : <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>
                            Tối đa 60 ký tự — Google cắt tiêu đề dài hơn trên kết quả tìm kiếm.
                          </p>
                      }
                    </div>

                    {/* Meta Description */}
                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label">
                        Meta Description (SEO)
                        <CharCounter value={form.meta_description} max={160} warn={0.85} />
                      </label>
                      <textarea className="form-textarea" rows={3} value={form.meta_description} onChange={set('meta_description')}
                        placeholder="Mô tả ngắn về bài viết hiển thị dưới tiêu đề trên Google..."
                        style={{ borderColor: errors.meta_description ? '#ef4444' : undefined }} />
                      {errors.meta_description
                        ? <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.meta_description}</p>
                        : <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>
                            Nên 120–160 ký tự — mô tả hấp dẫn giúp tăng tỷ lệ click từ Google.
                          </p>
                      }
                    </div>

                    {/* Meta Keywords */}
                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label">
                        Meta Keywords
                        <CharCounter value={form.meta_keywords} max={255} warn={0.8} />
                      </label>
                      <input className="form-input" value={form.meta_keywords} onChange={set('meta_keywords')}
                        placeholder="chăm sóc da, serum vitamin c, kem dưỡng ẩm" />
                      <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>
                        Các từ khóa phân cách bằng dấu phẩy. Google không dùng trực tiếp nhưng hỗ trợ nội bộ.
                      </p>
                    </div>

                    {/* Canonical URL */}
                    <div className="form-group">
                      <label className="form-label">Canonical URL (tuỳ chọn)</label>
                      <input className="form-input" type="url" value={form.canonical_url} onChange={set('canonical_url')}
                        placeholder="https://yoursite.com/tin-tuc/duong-dan-chinh-thuc"
                        style={{ borderColor: errors.canonical_url ? '#ef4444' : undefined }} />
                      {errors.canonical_url
                        ? <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.canonical_url}</p>
                        : <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>
                            Chỉ cần điền khi bài viết có nội dung trùng lặp từ nguồn khác.
                          </p>
                      }
                    </div>
                  </div>
                )}

                {/* ═══ TAB THUMBNAIL ═══ */}
                {activeTab === 'thumbnail' && (
                  <div>
                    {/* Thumbnail chính */}
                    <div style={{ marginBottom: 24 }}>
                      <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>
                        🖼️ Thumbnail bài viết
                      </label>
                      <div style={{ width: '100%', height: 200, borderRadius: 10, overflow: 'hidden',
                        border: '2px dashed #d1d5db', background: '#f9fafb',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', marginBottom: 8 }}>
                        {thumbPreview ? (
                          <>
                            <img src={getImgSrc(thumbPreview)} alt="thumb"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.target.style.display = 'none'; }} />
                            <button type="button" onClick={() => { setThumbFile(null); setThumbPreview(null); if (thumbRef.current) thumbRef.current.value = ''; }}
                              style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.55)',
                                color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28,
                                cursor: 'pointer', fontSize: 16 }}>×</button>
                          </>
                        ) : (
                          <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                            <div style={{ fontSize: 36, marginBottom: 8 }}>🖼️</div>
                            <p style={{ margin: 0, fontSize: 13 }}>Chưa có thumbnail</p>
                            <p style={{ margin: '4px 0 0', fontSize: 11 }}>Khuyến nghị: 1200×630px (tỷ lệ 16:9)</p>
                          </div>
                        )}
                      </div>
                      {thumbFile && (
                        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
                          📎 {thumbFile.name} ({(thumbFile.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                      <input ref={thumbRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleThumb} />
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => thumbRef.current?.click()}>
                        {thumbPreview ? '🔄 Đổi thumbnail' : '📁 Chọn thumbnail'}
                      </button>
                    </div>

                    {/* OG Image */}
                    <div>
                      <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>
                        📣 OG Image (Social Share)
                        <span style={{ fontSize: 11, fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>
                          — Ảnh hiển thị khi chia sẻ lên Facebook, Zalo...
                        </span>
                      </label>
                      <div style={{ width: '100%', height: 160, borderRadius: 10, overflow: 'hidden',
                        border: '2px dashed #d1d5db', background: '#f9fafb',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', marginBottom: 8 }}>
                        {ogPreview ? (
                          <>
                            <img src={getImgSrc(ogPreview)} alt="og"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.target.style.display = 'none'; }} />
                            <button type="button" onClick={() => { setOgFile(null); setOgPreview(null); if (ogRef.current) ogRef.current.value = ''; }}
                              style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.55)',
                                color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28,
                                cursor: 'pointer', fontSize: 16 }}>×</button>
                          </>
                        ) : (
                          <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                            <div style={{ fontSize: 32, marginBottom: 6 }}>📣</div>
                            <p style={{ margin: 0, fontSize: 12 }}>Để trống sẽ dùng Thumbnail</p>
                            <p style={{ margin: '2px 0 0', fontSize: 11 }}>Khuyến nghị: 1200×630px</p>
                          </div>
                        )}
                      </div>
                      <input ref={ogRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleOg} />
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => ogRef.current?.click()}>
                        {ogPreview ? '🔄 Đổi OG Image' : '📁 Chọn OG Image'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 28px', borderTop: '1px solid #e5e7eb',
                display: 'flex', gap: 8, justifyContent: 'flex-end', background: '#f8fafc',
                borderRadius: '0 0 16px 16px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 120 }}>
                  {saving ? '⏳ Đang lưu...' : editItem ? '💾 Cập nhật' : '🚀 Tạo bài viết'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostManagement;
