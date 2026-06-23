import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productApi } from '../../api/productApi';
import ProductCard from '../../components/ProductCard';

const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productApi.getProducts({ search: q, category, brand, sort, page, per_page: 12 });
      // Laravel paginated ResourceCollection: { data: [...], links: {...}, meta: { last_page, total, ... } }
      setProducts(res.data || []);
      setMeta(res.meta || {});
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [q, category, brand, sort, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    productApi.getCategories().then((d) => setCategories(d.data || d || [])).catch(() => {});
    productApi.getBrands().then((d) => setBrands(d.data || d || [])).catch(() => {});
  }, []);

  const updateParam = (key, val) => {
    const params = new URLSearchParams(searchParams);
    if (val) params.set(key, val);
    else params.delete(key);
    params.delete('page');
    setSearchParams(params);
  };

  const sortOptions = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'price_asc', label: 'Giá tăng dần' },
    { value: 'price_desc', label: 'Giá giảm dần' },
    { value: 'popular', label: 'Phổ biến nhất' },
  ];

  const totalPages = meta.last_page || 1;

  return (
    <div className="product-list-page">
      <div className="container">
        {/* Page Header */}
        <div className="product-list-page__header">
          <div>
            <h1 className="page-title">
              {q ? `Kết quả tìm kiếm: "${q}"` : 'Tất cả sản phẩm'}
            </h1>
            {meta.total != null && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 6 }}>
                {meta.total} sản phẩm
              </p>
            )}
          </div>
          {/* Sort */}
          <select
            className="form-select product-list-page__sort"
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="product-list-page__body">
          {/* Sidebar Filter */}
          <aside className={`product-filter${filterOpen ? ' open' : ''}`}>
            <div className="product-filter__header">
              <h3 className="product-filter__title">Lọc sản phẩm</h3>
              <button className="product-filter__clear" onClick={() => setSearchParams({})}>
                Xóa bộ lọc
              </button>
            </div>

            {/* Category */}
            <div className="product-filter__section">
              <h4 className="product-filter__label">Danh mục</h4>
              <div className="product-filter__options">
                <label className={`product-filter__option${!category ? ' active' : ''}`}>
                  <input type="radio" name="category" value="" checked={!category}
                    onChange={() => updateParam('category', '')} hidden />
                  Tất cả
                </label>
                {categories.map((cat) => (
                  <label key={cat.id} className={`product-filter__option${category === cat.slug ? ' active' : ''}`}>
                    <input type="radio" name="category" value={cat.slug}
                      checked={category === cat.slug}
                      onChange={() => updateParam('category', cat.slug)} hidden />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Brand */}
            {brands.length > 0 && (
              <div className="product-filter__section">
                <h4 className="product-filter__label">Thương hiệu</h4>
                <div className="product-filter__options">
                  <label className={`product-filter__option${!brand ? ' active' : ''}`}>
                    <input type="radio" name="brand" value="" checked={!brand}
                      onChange={() => updateParam('brand', '')} hidden />
                    Tất cả
                  </label>
                  {brands.map((b) => (
                    <label key={b.id} className={`product-filter__option${brand === b.slug ? ' active' : ''}`}>
                      <input type="radio" name="brand" value={b.slug}
                        checked={brand === b.slug}
                        onChange={() => updateParam('brand', b.slug)} hidden />
                      {b.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Products Grid */}
          <div className="product-list-page__content">
            {/* Mobile filter toggle */}
            <button className="product-list-page__filter-toggle" onClick={() => setFilterOpen(!filterOpen)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
              </svg>
              Bộ lọc
            </button>

            {loading ? (
              <div className="grid-products">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i}>
                    <div className="skeleton" style={{ aspectRatio: '4/5', borderRadius: 8 }} />
                    <div style={{ padding: '14px 0' }}>
                      <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 8, borderRadius: 4 }} />
                      <div className="skeleton" style={{ height: 16, width: '90%', marginBottom: 8, borderRadius: 4 }} />
                      <div className="skeleton" style={{ height: 14, width: '40%', borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">🔍</div>
                <p className="empty-state__title">Không tìm thấy sản phẩm</p>
                <p className="empty-state__text">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                <button className="btn btn-outline btn-sm" onClick={() => setSearchParams({})}>
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <>
                <div className="grid-products">
                  {products.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="pagination__btn"
                      disabled={page <= 1}
                      onClick={() => updateParam('page', String(page - 1))}
                    >
                      ← Trước
                    </button>
                    <div className="pagination__pages">
                      {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                        const p = i + 1;
                        return (
                          <button
                            key={p}
                            className={`pagination__page${page === p ? ' active' : ''}`}
                            onClick={() => updateParam('page', String(p))}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      className="pagination__btn"
                      disabled={page >= totalPages}
                      onClick={() => updateParam('page', String(page + 1))}
                    >
                      Tiếp →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;
