import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './superbase.ts';
import { useAuth } from './authcontext.jsx';
import blackbg from "./assets/paradice.jpg";

function Slider() {

    const { isAdmin } = useAuth();

    const [ slides, setslides ] = useState([]);
    const [ current, setcurrent ] = useState(0);
    const [ loading, setloading ] = useState(true);

    const [ showDeleteConfirm, setshowDeleteConfirm ] = useState(false);
    const [ showEditModal, setshowEditModal ] = useState(false);
    const [ editFile, seteditFile ] = useState(null);
    const [ targetName, settargetName ] = useState(null);

    const touchstartX = useRef(null);

    // ==========================
    // fetch slides
    // ==========================
    const getslides = async () => {

        setloading(true);

        const { data, error } = await supabase.storage
            .from("admin-images")
            .list("admin/assets/slider", { limit: 100, offset: 0 });

        if (error) {
            console.error(error);
            setloading(false);
            return;
        }

        const imgs = data
            .filter(item => item.name !== '.emptyFolderPlaceholder')
            .map((item) => {
                const { data: pub } = supabase.storage
                    .from("admin-images")
                    .getPublicUrl(`admin/assets/slider/${item.name}`);
                return { name: item.name, url: pub.publicUrl };
            });

        setslides(imgs);
        setcurrent(0);
        setloading(false);
    }

    useEffect(() => { getslides(); }, []);

    // ==========================
    // auto play
    // ==========================
    useEffect(() => {
        if (slides.length < 2) return;
        const timer = setInterval(() => {
            setcurrent(prev => (prev + 1) % slides.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [ slides ]);

    // ==========================
    // arrow nav
    // ==========================
    const prev = useCallback(() => {
        setcurrent(p => (p - 1 + slides.length) % slides.length);
    }, [ slides.length ]);

    const next = useCallback(() => {
        setcurrent(p => (p + 1) % slides.length);
    }, [ slides.length ]);

    // ==========================
    // touch swipe
    // ==========================
    const onTouchStart = (e) => {
        touchstartX.current = e.touches[0].clientX;
    }

    const onTouchEnd = (e) => {
        if (touchstartX.current === null) return;
        const diff = touchstartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
            diff > 0 ? next() : prev();
        }
        touchstartX.current = null;
    }

    // ==========================
    // upload
    // ==========================
    const upload = async (file) => {
        if (!file) return;
        const uniquename = `${Date.now()}_${file.name}`;
        const filepath = `admin/assets/slider/${uniquename}`;
        const { error } = await supabase.storage
            .from("admin-images")
            .upload(filepath, file);
        if (error) { console.error(error); return; }
        await getslides();
    }

    // ==========================
    // delete
    // ==========================
    const remove = async (name) => {
        const { error } = await supabase.storage
            .from("admin-images")
            .remove([`admin/assets/slider/${name}`]);
        if (error) { console.error(error); return; }
        await getslides();
    }

    // ==========================
    // edit
    // ==========================
    const editslide = async (oldname, newfile) => {
        if (!newfile) return;
        const { error: delerror } = await supabase.storage
            .from("admin-images")
            .remove([`admin/assets/slider/${oldname}`]);
        if (delerror) { console.error(delerror); return; }
        const uniquename = `${Date.now()}_${newfile.name}`;
        const newpath = `admin/assets/slider/${uniquename}`;
        const { error: uploaderror } = await supabase.storage
            .from("admin-images")
            .upload(newpath, newfile);
        if (uploaderror) { console.error(uploaderror); return; }
        await getslides();
    }

    return (
        <>
            {/* ======= BG SECTION ======= */}
            <div id="sl-section" style={{ '--sl-bg': `url(${blackbg})` }}>

                <div id="slwrap">

                    {/* ======= SLIDER BOX ======= */}
                    <div
                        id="slbox"
                        onTouchStart={onTouchStart}
                        onTouchEnd={onTouchEnd}
                    >

                        { loading &&
                            <div id="slloader">
                                <div id="slspinner"/>
                            </div>
                        }

                        { !loading && slides.length === 0 &&
                            <div id="slempty">
                                <p>no slides yet</p>
                                { isAdmin && <span>upload your first image below</span> }
                            </div>
                        }

                        { !loading && slides.length > 0 &&
                            <>
                                { slides.map((slide, i) => (
                                    <div
                                        id="slslide"
                                        key={slide.name}
                                        style={{
                                            opacity: i === current ? 1 : 0,
                                            zIndex: i === current ? 2 : 1,
                                            pointerEvents: i === current ? "auto" : "none"
                                        }}
                                    >
                                        <img src={slide.url} alt="" />
                                        <div id="sloverlay"/>
                                    </div>
                                ))}

                                { slides.length > 1 &&
                                    <>
                                        <button id="slarrow" className="slleft" onClick={prev}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                                        </button>
                                        <button id="slarrow" className="slright" onClick={next}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                                        </button>
                                    </>
                                }

                                { slides.length > 1 &&
                                    <div id="sldots">
                                        { slides.map((_, i) => (
                                            <button
                                                key={i}
                                                className={`sldot${i === current ? " slactive" : ""}`}
                                                onClick={() => setcurrent(i)}
                                            />
                                        ))}
                                    </div>
                                }

                                <div id="slcounter">
                                    {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                                </div>

                            </>
                        }

                        {/* admin toolbar */}
                        { isAdmin &&
                            <div id="sladminbar">

                                <input id="slup-input" type="file" accept="image/*"
                                    onChange={(e) => upload(e.target.files[0])}
                                />
                                <button id="slupbtn" onClick={() => document.getElementById("slup-input").click()}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    <span>upload</span>
                                </button>

                                { slides.length > 0 &&
                                    <>
                                        <button id="sleditbtn"
                                            onClick={() => {
                                                settargetName(slides[current].name);
                                                setshowEditModal(true);
                                                document.body.style.overflow = "hidden";
                                            }}>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                            <span>edit</span>
                                        </button>

                                        <button id="sldelbtn"
                                            onClick={() => {
                                                settargetName(slides[current].name);
                                                setshowDeleteConfirm(true);
                                                document.body.style.overflow = "hidden";
                                            }}>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                            <span>delete</span>
                                        </button>
                                    </>
                                }

                            </div>
                        }

                    </div>
                    {/* end slbox */}

                </div>
                {/* end slwrap */}

            </div>
            {/* end sl-section */}

            {/* ======= DELETE MODAL ======= */}
            { showDeleteConfirm &&
                <div id="slmodalbg">
                    <div id="slmodal">
                        <div id="slmodalicon">⚠</div>
                        <h2 id="slmodaltext">delete this slide?</h2>
                        <p id="slmodalsub">this cannot be undone</p>
                        <div id="slmodalbtns">
                            <button id="slcancel"
                                onClick={() => {
                                    setshowDeleteConfirm(false);
                                    settargetName(null);
                                    document.body.style.overflow = "auto";
                                }}>cancel</button>
                            <button id="slconfirm"
                                onClick={async () => {
                                    await remove(targetName);
                                    setshowDeleteConfirm(false);
                                    settargetName(null);
                                    document.body.style.overflow = "auto";
                                }}>delete</button>
                        </div>
                    </div>
                </div>
            }

            {/* ======= EDIT MODAL ======= */}
            { showEditModal &&
                <div id="slmodalbg">
                    <div id="slmodal">
                        <div id="slmodalicon">✎</div>
                        <h2 id="slmodaltext">replace slide</h2>
                        <p id="slmodalsub">choose a new image</p>
                        <input id="sledit-input" type="file" accept="image/*"
                            onChange={(e) => seteditFile(e.target.files[0])}
                        />
                        <button id="slchoose" onClick={() => document.getElementById("sledit-input").click()}>
                            { editFile ? editFile.name : "choose file" }
                        </button>
                        <div id="slmodalbtns">
                            <button id="slcancel"
                                onClick={() => {
                                    setshowEditModal(false);
                                    settargetName(null);
                                    seteditFile(null);
                                    document.body.style.overflow = "auto";
                                }}>cancel</button>
                            <button id="slconfirm"
                                onClick={async () => {
                                    await editslide(targetName, editFile);
                                    setshowEditModal(false);
                                    settargetName(null);
                                    seteditFile(null);
                                    document.body.style.overflow = "auto";
                                }}>confirm</button>
                        </div>
                    </div>
                </div>
            }
        </>
    );
}

export default Slider;