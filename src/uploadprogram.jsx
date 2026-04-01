import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './superbase.ts';
import { useAuth } from './authcontext.jsx';

const CATEGORY_SIZES = {
    sneakers : ['36','37','38','39','40','41','42','43','44','45'],
    clothes  : ['XS','S','M','L','XL','XXL'],
    pants    : ['34','36','38','40','42','44','46','48'],
    caps     : [],
};

const CATEGORIES = ['sneakers','clothes','pants','caps'];

const EMPTY_UPLOAD = { file: null, name: '', price: '', cat: 'sneakers' };
const EMPTY_EDIT   = { id: null, oldImg: null, file: null, name: '', price: '', cat: 'sneakers' };

function Test2({ onProductClick }) {

    const { isAdmin } = useAuth();

    const [ products,    setProducts    ] = useState([]);
    const [ showUpload,  setShowUpload  ] = useState(false);
    const [ uploadForm,  setUploadForm  ] = useState(EMPTY_UPLOAD);
    const [ showConfirm, setShowConfirm ] = useState(false);
    const [ deleteTarget,setDeleteTarget] = useState({ id: null, img: null });
    const [ showEdit,    setShowEdit    ] = useState(false);
    const [ editForm,    setEditForm    ] = useState(EMPTY_EDIT);

    // ── prevent double-fetch ──
    const hasFetched = useRef(false);

    // ==========================
    // fetch products (cached)
    // ==========================
    const getProducts = useCallback(async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) { console.error(error); return; }
        setProducts(data);
    }, []);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        getProducts();
    }, [getProducts]);

    // ==========================
    // listen for upload event from navbar
    // ==========================
    useEffect(() => {
        const open = () => { setShowUpload(true); document.body.style.overflow = 'hidden'; };
        window.addEventListener('gallery-upload-open', open);
        return () => window.removeEventListener('gallery-upload-open', open);
    }, []);

    // ==========================
    // upload product
    // ==========================
    const confirmUpload = async () => {
        const { file, name, price, cat } = uploadForm;
        if (!file || !name || !price) return;

        const uniquename = `${Date.now()}_${file.name}`;
        const filepath   = `admin/assets/gallery/${uniquename}`;

        const { error: uploaderror } = await supabase.storage
            .from('admin-images')
            .upload(filepath, file);
        if (uploaderror) { console.error(uploaderror); return; }

        const { data: pub } = supabase.storage
            .from('admin-images')
            .getPublicUrl(filepath);

        const { error: dberror } = await supabase
            .from('products')
            .insert({ name, price: parseFloat(price), image_url: pub.publicUrl, category: cat });
        if (dberror) { console.error(dberror); return; }

        setUploadForm(EMPTY_UPLOAD);
        setShowUpload(false);
        document.body.style.overflow = 'auto';
        await getProducts();
    };

    const closeUpload = () => {
        setUploadForm(EMPTY_UPLOAD);
        setShowUpload(false);
        document.body.style.overflow = 'auto';
    };

    // ==========================
    // delete product
    // ==========================
    const remove = async () => {
        const { id, img } = deleteTarget;
        const { error: dberror } = await supabase.from('products').delete().eq('id', id);
        if (dberror) { console.error(dberror); return; }

        const path = img.split('/admin-images/')[1];
        if (path) await supabase.storage.from('admin-images').remove([decodeURIComponent(path)]);

        setProducts(prev => prev.filter(p => p.id !== id));
        setDeleteTarget({ id: null, img: null });
        setShowConfirm(false);
        document.body.style.overflow = 'auto';
    };

    // ==========================
    // edit product
    // ==========================
    const openEdit = (product) => {
        setEditForm({
            id     : product.id,
            oldImg : product.image_url,
            file   : null,
            name   : product.name,
            price  : String(product.price),
            cat    : product.category || 'sneakers',
        });
        setShowEdit(true);
        document.body.style.overflow = 'hidden';
    };

    const closeEdit = () => {
        setEditForm(EMPTY_EDIT);
        setShowEdit(false);
        document.body.style.overflow = 'auto';
    };

    const confirmEdit = async () => {
        const { id, oldImg, file, name, price, cat } = editForm;
        let newImageUrl = null;

        if (file) {
            const oldpath = oldImg.split('/admin-images/')[1];
            if (oldpath) await supabase.storage.from('admin-images').remove([decodeURIComponent(oldpath)]);

            const uniquename = `${Date.now()}_${file.name}`;
            const filepath   = `admin/assets/gallery/${uniquename}`;
            const { error: uploaderror } = await supabase.storage
                .from('admin-images')
                .upload(filepath, file);
            if (uploaderror) { console.error(uploaderror); return; }

            const { data: pub } = supabase.storage.from('admin-images').getPublicUrl(filepath);
            newImageUrl = pub.publicUrl;
        }

        const updates = {
            name,
            price    : parseFloat(price),
            category : cat,
            ...(newImageUrl && { image_url: newImageUrl }),
        };

        const { error } = await supabase.from('products').update(updates).eq('id', id);
        if (error) { console.error(error); return; }

        setEditForm(EMPTY_EDIT);
        setShowEdit(false);
        document.body.style.overflow = 'auto';
        await getProducts();
    };

    return (
        <>
            <div id="img7awifather">
                <h1 id='products'> products </h1>
                <div id="img7awi">
                    { products.map((product) => (
                        <div key={product.id} className={`product-card ${product.isNew ? 'card-new' : ''}`}>
                            <div
                                className="product-img-wrap"
                                onClick={() => onProductClick(product.id)}
                                style={{ cursor: 'pointer' }}
                            >
                                {/* ✅ FIX 1: loading="lazy" — images only load when visible */}
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    loading="lazy"
                                    decoding="async"
                                />

                                { isAdmin &&
                                    <div id="imgbtngroup">
                                        <button id="edit" onClick={(e) => { e.stopPropagation(); openEdit(product); }}>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                            </svg>
                                            edit
                                        </button>
                                        <button id="delete" onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteTarget({ id: product.id, img: product.image_url });
                                            setShowConfirm(true);
                                            document.body.style.overflow = 'hidden';
                                        }}>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <polyline points="3 6 5 6 21 6"/>
                                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                                <path d="M10 11v6"/><path d="M14 11v6"/>
                                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                            </svg>
                                            delete
                                        </button>
                                    </div>
                                }
                            </div>
                            <div className="product-info">
                                <span
                                    className="product-name"
                                    onClick={() => onProductClick(product.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    { product.name }
                                </span>
                                <span className="product-price">${ Number(product.price).toFixed(2) }</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ======= UPLOAD MODAL ======= */}
            { showUpload &&
                <div id="confather">
                    <div id="confirmidel" className="upload-modal">
                        <h1 id="text">add new product</h1>

                        <div className="upload-img-preview" onClick={() => document.getElementById('real-file-input').click()}>
                            { uploadForm.file
                                ? <img src={URL.createObjectURL(uploadForm.file)} alt="preview" />
                                : <>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="17 8 12 3 7 8"/>
                                        <line x1="12" y1="3" x2="12" y2="15"/>
                                    </svg>
                                    <span>click to choose image</span>
                                </>
                            }
                        </div>
                        <input
                            id="real-file-input"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => setUploadForm(f => ({ ...f, file: e.target.files[0] }))}
                        />

                        <input
                            className="product-input"
                            type="text"
                            placeholder="product name"
                            value={uploadForm.name}
                            onChange={(e) => setUploadForm(f => ({ ...f, name: e.target.value }))}
                        />

                        <div className="price-input-wrap">
                            <span className="price-symbol">$</span>
                            <input
                                className="product-input price-input"
                                type="number"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                value={uploadForm.price}
                                onChange={(e) => setUploadForm(f => ({ ...f, price: e.target.value }))}
                            />
                        </div>

                        <div className="category-selector">
                            { CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    className={`cat-btn${ uploadForm.cat === cat ? ' cat-active' : '' }`}
                                    onClick={() => setUploadForm(f => ({ ...f, cat }))}
                                >
                                    { cat }
                                </button>
                            ))}
                        </div>

                        <div id="slmodalbtns">
                            <button id="koko" onClick={closeUpload}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                                cancel
                            </button>
                            <button
                                id="koko"
                                className="confirm-btn"
                                onClick={confirmUpload}
                                disabled={!uploadForm.file || !uploadForm.name || !uploadForm.price}
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                confirm
                            </button>
                        </div>
                    </div>
                </div>
            }

            {/* ======= DELETE MODAL ======= */}
            { showConfirm &&
                <div id="confather">
                    <div id="confirmidel">
                        <h1 id="text">delete this product?</h1>
                        <p className="modal-sub">this cannot be undone</p>
                        <div id="slmodalbtns">
                            <button id="koko" onClick={() => {
                                setShowConfirm(false);
                                setDeleteTarget({ id: null, img: null });
                                document.body.style.overflow = 'auto';
                            }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                                cancel
                            </button>
                            <button id="koko" className="danger-btn" onClick={remove}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                    <path d="M10 11v6"/><path d="M14 11v6"/>
                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                </svg>
                                delete
                            </button>
                        </div>
                    </div>
                </div>
            }

            {/* ======= EDIT MODAL ======= */}
            { showEdit &&
                <div id="confather">
                    <div id="confirmidel" className="upload-modal">
                        <h1 id="text">edit product</h1>

                        <div className="upload-img-preview" onClick={() => document.getElementById('edit-file-input').click()}>
                            { editForm.file
                                ? <img src={URL.createObjectURL(editForm.file)} alt="preview" />
                                : <img src={editForm.oldImg} alt="current" loading="lazy" decoding="async" />
                            }
                            <div className="img-overlay-hint">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="17 8 12 3 7 8"/>
                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                                change image
                            </div>
                        </div>
                        <input
                            id="edit-file-input"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => setEditForm(f => ({ ...f, file: e.target.files[0] }))}
                        />

                        <input
                            className="product-input"
                            type="text"
                            placeholder="product name"
                            value={editForm.name}
                            onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                        />

                        <div className="price-input-wrap">
                            <span className="price-symbol">$</span>
                            <input
                                className="product-input price-input"
                                type="number"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                value={editForm.price}
                                onChange={(e) => setEditForm(f => ({ ...f, price: e.target.value }))}
                            />
                        </div>

                        <div className="category-selector">
                            { CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    className={`cat-btn${ editForm.cat === cat ? ' cat-active' : '' }`}
                                    onClick={() => setEditForm(f => ({ ...f, cat }))}
                                >
                                    { cat }
                                </button>
                            ))}
                        </div>

                        <div id="slmodalbtns">
                            <button id="koko" onClick={closeEdit}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                                cancel
                            </button>
                            <button id="koko" className="confirm-btn" onClick={confirmEdit}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                save
                            </button>
                        </div>
                    </div>
                </div>
            }
        </>
    );
}

export default Test2;