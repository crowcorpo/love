import { useState, useEffect, useCallback } from "react";
import { supabase } from "./superbase.ts";
import { useAuth } from "./authcontext.jsx";
import Messages from "./messages.jsx";

function Navbar({ hideLinks }) {

    const { user, isAdmin, signIn, signOut } = useAuth();

    const [ show,         setShow         ] = useState(false);
    const [ scrolled,     setScrolled     ] = useState(false);
    const [ showMessages, setShowMessages ] = useState(false);
    const [ unreadCount,  setUnreadCount  ] = useState(0);

    const fetchUnread = useCallback(async () => {
        if (!isAdmin) return;
        const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false);
        setUnreadCount(count || 0);
    }, [isAdmin]);

    useEffect(() => {
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, [fetchUnread]);

    useEffect(() => {
        if (!isAdmin) return;
        const channel = supabase
            .channel('messages-inserts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
                setUnreadCount(prev => prev + 1);
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [isAdmin]);

    useEffect(() => {
        document.body.style.overflow = show ? "hidden" : "auto";
        return () => { document.body.style.overflow = "auto"; };
    }, [show]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const scrollToSection = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        setShow(false);
    };

    const handleUpload = () => {
        window.dispatchEvent(new CustomEvent("gallery-upload-open"));
    };

    const openMessages = () => {
        setShowMessages(true);
        setUnreadCount(0);
        setShow(false);
    };

    const links = [
        { label: "Home",     id: "hero"          },
        { label: "Products", id: "img7awifather" },
        { label: "About Us", id: "footer"        },
    ];

    const MessagesBtn = () => (
        <button id="nav-messages-btn" onClick={openMessages} aria-label="Orders">
            <span id="nav-messages-icon-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                { unreadCount > 0 &&
                    <span id="nav-messages-badge">
                        { unreadCount > 99 ? '99+' : unreadCount }
                    </span>
                }
            </span>
        </button>
    );

    return (
        <>
            <header className={`navbar${scrolled ? " navbar--scrolled" : ""}`}>
                <div className="navbar__inner">

                    <div id="levelup" onClick={() => scrollToSection("hero")}>
                        CORPO
                    </div>

                    <nav className="navbar__links">
                        <ul>
                            { !hideLinks && links.map((l) => (
                                <li key={l.id} onClick={() => scrollToSection(l.id)}>
                                    {l.label}
                                    <span className="navbar__underline"/>
                                </li>
                            ))}

                            { !hideLinks && isAdmin &&
                                <li>
                                    <button id="nav-upload-btn" onClick={handleUpload}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                            <polyline points="17 8 12 3 7 8"/>
                                            <line x1="12" y1="3" x2="12" y2="15"/>
                                        </svg>
                                        Upload
                                    </button>
                                </li>
                            }

                            { isAdmin &&
                                <li style={{ padding: 0 }}>
                                    <MessagesBtn/>
                                </li>
                            }

                            <li>
                                <button id="signinwith" className={user ? "signed-in" : ""} onClick={user ? signOut : signIn}>
                                    <svg className="signinwith__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                    {user ? "Sign Out" : "Sign In"}
                                </button>
                            </li>
                        </ul>
                    </nav>

                    <div className="navbar__right-mobile">
                        { isAdmin && <MessagesBtn/> }
                        { !hideLinks &&
                            <button
                                className={`navbar__hamburger${show ? " open" : ""}`}
                                onClick={() => setShow(v => !v)}
                                aria-label="Toggle menu"
                            >
                                <span/><span/><span/>
                            </button>
                        }
                    </div>

                </div>

                { !hideLinks &&
                    <nav className={`navbar__mobile${show ? " navbar__mobile--open" : ""}`}>
                        <ul>
                            { links.map((l) => (
                                <li key={l.id} onClick={() => scrollToSection(l.id)}>
                                    {l.label}
                                </li>
                            ))}
                            <li onClick={() => { user ? signOut() : signIn(); setShow(false); }}>
                                {user ? "Sign Out" : "Sign In"}
                            </li>
                        </ul>
                        { isAdmin &&
                            <div className="mobile-upload-row">
                                <button id="nav-upload-btn" onClick={() => { handleUpload(); setShow(false); }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="17 8 12 3 7 8"/>
                                        <line x1="12" y1="3" x2="12" y2="15"/>
                                    </svg>
                                    Upload Image
                                </button>
                            </div>
                        }
                    </nav>
                }
            </header>

            { show && <div className="navbar__backdrop" onClick={() => setShow(false)}/> }

            { showMessages &&
                <Messages onClose={() => { setShowMessages(false); fetchUnread(); }}/>
            }
        </>
    );
}

export default Navbar;