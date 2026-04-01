import { useState, useEffect, useCallback } from 'react';
import { supabase } from './superbase.ts';
import './messages.css';

function Messages({ onClose }) {

    const [ messages,  setMessages  ] = useState([]);
    const [ loading,   setLoading   ] = useState(true);
    const [ expanded,  setExpanded  ] = useState(null);
    const [ selected,  setSelected  ] = useState(new Set());

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) { console.error(error); setLoading(false); return; }
        setMessages(data || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchMessages();
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
    }, [fetchMessages]);

    useEffect(() => {
        const markRead = async () => {
            await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('is_read', false);
        };
        markRead();
    }, []);

    const toggleCheck = async (id, current) => {
        await supabase.from('messages').update({ is_checked: !current }).eq('id', id);
        setMessages(prev => prev.map(m => m.id === id ? { ...m, is_checked: !current } : m));
    };

    const deleteOne = async (id) => {
        await supabase.from('messages').delete().eq('id', id);
        setMessages(prev => prev.filter(m => m.id !== id));
        setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
        if (expanded === id) setExpanded(null);
    };

    const deleteSelected = async () => {
        if (selected.size === 0) return;
        const ids = [...selected];
        await supabase.from('messages').delete().in('id', ids);
        setMessages(prev => prev.filter(m => !ids.includes(m.id)));
        setSelected(new Set());
        if (ids.includes(expanded)) setExpanded(null);
    };

    const toggleSelect = (id) => {
        setSelected(prev => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });
    };

    const selectAll = () => {
        if (selected.size === messages.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(messages.map(m => m.id)));
        }
    };

    return (
        <div id="msg-overlay">
            <div id="msg-page">

                <div id="msg-header">
                    <div id="msg-header-left">
                        <h1 id="msg-title">orders</h1>
                        <span id="msg-count">{messages.length}</span>
                    </div>
                    <div id="msg-header-right">
                        { selected.size > 0 &&
                            <button id="msg-bulk-delete" onClick={deleteSelected}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                </svg>
                                delete {selected.size}
                            </button>
                        }
                        { messages.length > 0 &&
                            <button id="msg-select-all" onClick={selectAll}>
                                { selected.size === messages.length ? 'deselect all' : 'select all' }
                            </button>
                        }
                        <button id="msg-close" onClick={onClose}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div id="msg-body">

                    { loading &&
                        <div id="msg-loading"><div id="msg-spinner"/></div>
                    }

                    { !loading && messages.length === 0 &&
                        <div id="msg-empty">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                            <p>no orders yet</p>
                        </div>
                    }

                    { !loading && messages.map(msg => (
                        <div
                            key={msg.id}
                            className={`msg-card${msg.is_checked ? ' msg-card--checked' : ''}${selected.has(msg.id) ? ' msg-card--selected' : ''}`}
                        >
                            <div className="msg-card-top" onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}>

                                <input
                                    type="checkbox"
                                    className="msg-checkbox"
                                    checked={selected.has(msg.id)}
                                    onClick={e => e.stopPropagation()}
                                    onChange={() => toggleSelect(msg.id)}
                                />

                                <div className="msg-card-info">
                                    <span className="msg-card-name">{msg.fullname}</span>
                                    <span className="msg-card-meta">
                                        {msg.product_name} · qty {msg.quantity}
                                    </span>
                                </div>

                                <div className="msg-card-actions">
                                    <button
                                        className={`msg-check-btn${msg.is_checked ? ' active' : ''}`}
                                        title={msg.is_checked ? 'mark unsold' : 'mark sold'}
                                        onClick={e => { e.stopPropagation(); toggleCheck(msg.id, msg.is_checked); }}
                                    >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                    </button>
                                    <button
                                        className="msg-del-btn"
                                        title="delete"
                                        onClick={e => { e.stopPropagation(); deleteOne(msg.id); }}
                                    >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <polyline points="3 6 5 6 21 6"/>
                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                        </svg>
                                    </button>
                                    <svg
                                        className={`msg-chevron${expanded === msg.id ? ' open' : ''}`}
                                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                    >
                                        <polyline points="6 9 12 15 18 9"/>
                                    </svg>
                                </div>
                            </div>

                            { expanded === msg.id &&
                                <div className="msg-card-details">
                                    <div className="msg-detail-grid">
                                        <div className="msg-detail-row"><span>product</span><span>{msg.product_name}</span></div>
                                        <div className="msg-detail-row"><span>price</span><span>{msg.product_price} DA</span></div>
                                        <div className="msg-detail-row"><span>size</span><span>{msg.size}</span></div>
                                        <div className="msg-detail-row"><span>quantity</span><span>{msg.quantity}</span></div>
                                        <div className="msg-detail-row"><span>total</span><span>{msg.total_price} DA</span></div>
                                        <div className="msg-detail-row"><span>category</span><span>{msg.category}</span></div>
                                        <div className="msg-detail-divider"/>
                                        <div className="msg-detail-row"><span>name</span><span>{msg.fullname}</span></div>
                                        <div className="msg-detail-row"><span>email</span><span>{msg.email}</span></div>
                                        <div className="msg-detail-row"><span>phone</span><span>{msg.phone}</span></div>
                                        <div className="msg-detail-row"><span>address</span><span>{msg.address}</span></div>
                                        <div className="msg-detail-row"><span>city</span><span>{msg.city}</span></div>
                                        <div className="msg-detail-row"><span>wilaya</span><span>{msg.wilaya}</span></div>
                                        <div className="msg-detail-divider"/>
                                        <div className="msg-detail-row"><span>ordered at</span><span>{msg.ordered_at}</span></div>
                                        <div className="msg-detail-row">
                                            <span>status</span>
                                            <span className={msg.is_checked ? 'msg-status-sold' : 'msg-status-pending'}>
                                                {msg.is_checked ? 'sold ✓' : 'pending'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}

export default Messages;