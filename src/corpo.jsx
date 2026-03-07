 import { useState, useEffect, useRef } from "react";
import "./Corpo.css";

// ─── optional: swap these back to your real assets ───
// import setting from "./assets/menus.png";
// import crow from "./assets/corpo.png";

export default function Corpo() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loaded,   setLoaded]   = useState(false);
  const canvasRef  = useRef(null);
  const cursorRef  = useRef(null);
  const ringRef    = useRef(null);

  /* ── loader ── */
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 1800);
    return () => clearTimeout(t);
  }, []);

  /* ── counter animation (runs after loader) ── */
  useEffect(() => {
    if (!loaded) return;
    document.querySelectorAll(".stat-num").forEach((el) => {
      const target = +el.dataset.count;
      let cur = 0;
      const step = target / 40;
      const id = setInterval(() => {
        cur = Math.min(cur + step, target);
        el.textContent = Math.round(cur) + "+";
        if (cur >= target) clearInterval(id);
      }, 35);
    });
  }, [loaded]);

  /* ── custom cursor ── */
  useEffect(() => {
    const cur  = cursorRef.current;
    const ring = ringRef.current;
    if (!cur || !ring) return;
    let mx = 0, my = 0, rx = 0, ry = 0;
    const onMove = (e) => { mx = e.clientX; my = e.clientY; };
    document.addEventListener("mousemove", onMove);
    let raf;
    const loop = () => {
      cur.style.left = mx + "px";
      cur.style.top  = my + "px";
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + "px";
      ring.style.top  = ry + "px";
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { document.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  /* ── scroll reveal ── */
  useEffect(() => {
    const els = document.querySelectorAll(".reveal,.reveal-left,.reveal-right,.reveal-scale");
    const io  = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* ── particle canvas ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, particles = [], raf;
    const COLORS = ["rgba(0,240,212,","rgba(255,43,109,","rgba(168,85,247,","rgba(255,229,0,"];

    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x      = Math.random() * W;
        this.y      = Math.random() * H;
        this.size   = Math.random() * 1.8 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.color  = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.opacity = Math.random() * 0.5 + 0.1;
        this.life    = 0;
        this.maxLife = Math.random() * 300 + 200;
      }
      update() {
        this.x += this.speedX; this.y += this.speedY; this.life++;
        if (this.life > this.maxLife || this.x<0||this.x>W||this.y<0||this.y>H) this.reset();
      }
      draw() {
        const p = this.life / this.maxLife;
        const fade = p < 0.1 ? p * 10 : p > 0.9 ? (1 - p) * 10 : 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color + this.opacity * fade + ")";
        ctx.fill();
      }
    }

    for (let i = 0; i < 120; i++) particles.push(new Particle());

    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d  = Math.sqrt(dx*dx + dy*dy);
          if (d < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0,240,212,${(1-d/100)*0.06})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
        particles[i].update();
        particles[i].draw();
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(raf); };
  }, []);

  /* ── navbar scroll glow ── */
  useEffect(() => {
    const nav = document.querySelector(".topnav");
    const onScroll = () => {
      if (!nav) return;
      if (window.scrollY > 50) {
        nav.style.borderBottomColor = "rgba(0,240,212,.12)";
        nav.style.boxShadow = "0 4px 30px rgba(0,240,212,.07)";
      } else {
        nav.style.borderBottomColor = "";
        nav.style.boxShadow = "";
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── 3D tilt on cards ── */
  useEffect(() => {
    const cards = document.querySelectorAll(".svc-card,.proj-card,.blog-card");
    const onMove = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      e.currentTarget.style.transform = `translateY(-10px) rotateX(${-y*6}deg) rotateY(${x*6}deg)`;
      e.currentTarget.style.transition = "transform 0.1s ease";
    };
    const onLeave = (e) => {
      e.currentTarget.style.transform = "";
      e.currentTarget.style.transition = "transform 0.4s cubic-bezier(.4,0,.2,1)";
    };
    cards.forEach((c) => { c.addEventListener("mousemove", onMove); c.addEventListener("mouseleave", onLeave); });
    return () => cards.forEach((c) => { c.removeEventListener("mousemove", onMove); c.removeEventListener("mouseleave", onLeave); });
  }, []);

  /* ── magnetic buttons ── */
  useEffect(() => {
    const btns = document.querySelectorAll(".btn-main,.nav-cta,.c-submit");
    const onMove  = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width  / 2) * 0.25;
      const y = (e.clientY - r.top  - r.height / 2) * 0.25;
      e.currentTarget.style.transform = `translate(${x}px,${y}px) translateY(-3px) scale(1.04)`;
    };
    const onLeave = (e) => { e.currentTarget.style.transform = ""; };
    btns.forEach((b) => { b.addEventListener("mousemove", onMove); b.addEventListener("mouseleave", onLeave); });
    return () => btns.forEach((b) => { b.removeEventListener("mousemove", onMove); b.removeEventListener("mouseleave", onLeave); });
  }, []);

  /* ── logo glitch ── */
  useEffect(() => {
    const logo  = document.querySelector(".nav-logo");
    if (!logo) return;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const orig  = "CORPO";
    let interval;
    const onEnter = () => {
      let iter = 0;
      clearInterval(interval);
      interval = setInterval(() => {
        logo.textContent = orig.split("").map((c, i) =>
          i < iter ? orig[i] : chars[Math.floor(Math.random() * chars.length)]
        ).join("");
        iter += 0.4;
        if (iter >= orig.length) { logo.textContent = orig; clearInterval(interval); }
      }, 40);
    };
    logo.addEventListener("mouseenter", onEnter);
    return () => { logo.removeEventListener("mouseenter", onEnter); clearInterval(interval); };
  }, []);

  /* ── hero line-mask reveal ── */
  useEffect(() => {
    if (!loaded) return;
    const h1 = document.querySelector(".hero-h1");
    if (!h1) return;
    const lines = h1.innerHTML.split("<br>");
    h1.innerHTML = lines.map((line, i) =>
      `<div style="display:block;overflow:hidden">` +
      `<span style="display:block;animation:lineIn .6s ${i*0.12}s ease both">${line}</span>` +
      `</div>`
    ).join("");
    const style = document.createElement("style");
    style.textContent = `@keyframes lineIn{from{transform:translateY(100%)}to{transform:translateY(0)}}`;
    document.head.appendChild(style);
    return () => style.remove();
  }, [loaded]);

  /* ── menu scroll lock ── */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  };

  const NAV = ["about","services","projects","blog","contact"];

  return (
    <>
      {/* cursor */}
      <div id="cursor"      ref={cursorRef} />
      <div id="cursor-ring" ref={ringRef}   />

      {/* particles */}
      <canvas id="particles" ref={canvasRef} />

      {/* loader */}
      <div id="loader" className={loaded ? "gone" : ""}>
        <div className="loader-logo">CORPO</div>
        <div className="loader-bar"><div className="loader-bar-fill" /></div>
        <div className="loader-text">Loading experience...</div>
      </div>

      {/* ── NAV ── */}
      <nav className="topnav">
        <span className="nav-logo" onClick={() => scrollTo("hero")}>CORPO</span>
        <ul className="nav-links">
          {NAV.map((s) => (
            <li key={s}><a href={`#${s}`} onClick={(e) => { e.preventDefault(); scrollTo(s); }}>{s.charAt(0).toUpperCase()+s.slice(1)}</a></li>
          ))}
        </ul>
        <button className="nav-cta" onClick={() => window.open("https://www.fiverr.com/s/qDXBYoZ","_blank")}>
          <span>Hire Me</span>
        </button>
        <div className={`hamburger${menuOpen?" open":""}`} onClick={() => setMenuOpen(!menuOpen)}>
          <span/><span/><span/>
        </div>
      </nav>

      {/* mobile menu */}
      <div className={`mobile-menu${menuOpen?" open":""}`}>
        {NAV.map((s) => (
          <a key={s} href={`#${s}`} onClick={(e) => { e.preventDefault(); scrollTo(s); }}>
            {s.charAt(0).toUpperCase()+s.slice(1)}
          </a>
        ))}
      </div>

      <main>
        {/* ── HERO ── */}
        <section id="hero">
          <div className="orb orb1" />
          <div className="orb orb2" />
          <div className="orb orb3" />

          <div className="hero-left">
            <div className="hero-badge">
              <span className="dot" /> Available for new projects
            </div>
            <h1 className="hero-h1">
              FULL<br/>
              <span className="g">STACK</span><br/>
              DEV
            </h1>
            <p className="hero-sub">
              I build <strong>exceptional digital experiences</strong> — fast, beautiful,
              and built to convert. From concept to deployment.
            </p>
            <div className="hero-actions">
              <button className="btn-main" onClick={() => window.open("https://www.fiverr.com/s/qDXBYoZ","_blank")}>
                <span>Get Started →</span>
              </button>
              <a href="#projects" className="btn-out" onClick={(e)=>{e.preventDefault();scrollTo("projects")}}>View Work</a>
            </div>
            <div className="hero-stats">
              <div><div className="stat-num" data-count="12">0</div><div className="stat-lbl">Projects Done</div></div>
              <div><div className="stat-num" data-count="8">0</div><div className="stat-lbl">Happy Clients</div></div>
              <div><div className="stat-num" data-count="2">0</div><div className="stat-lbl">Years Exp</div></div>
            </div>
          </div>

          <div className="hero-right">
            <div className="visual">
              <div className="ring ring1" />
              <div className="ring ring2" />
              <div className="ring ring3" />
              <div className="visual-core"><span className="visual-core-txt">C</span></div>
              <div className="chip chip1">⚛️ React</div>
              <div className="chip chip2">🔧 Supabase</div>
              <div className="chip chip3">⚡ Next.js</div>
              <div className="chip chip4">🎨 CSS3</div>
            </div>
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <div className="marquee-strip">
          <div className="marquee-track">
            {["React","·","Next.js","·","Supabase","·","JavaScript","·","CSS3","·","HTML5","·","Node.js","·","Git","·","Full Stack","·","Web Design","·","UI/UX","·","Performance","·",
              "React","·","Next.js","·","Supabase","·","JavaScript","·","CSS3","·","HTML5","·","Node.js","·","Git","·","Full Stack","·","Web Design","·","UI/UX","·","Performance","·"
            ].map((w,i)=>(
              <span key={i} className={["React","Next.js","CSS3","Full Stack"].includes(w)?"hi":["Supabase","Node.js","UI/UX"].includes(w)?"hi2":""}>{w}</span>
            ))}
          </div>
        </div>

        {/* ── ABOUT ── */}
        <section id="about">
          <div className="wrap">
            <div className="about-grid">
              <div className="about-text reveal-left">
                <span className="eyebrow">Who I am</span>
                <h2 className="s-title">ABOUT<br/><span className="ac">ME</span></h2>
                <p className="about-body">
                  I'm a <strong>passionate full-stack developer</strong> dedicated to crafting beautiful,
                  high-performance web experiences. I turn complex problems into elegant,
                  pixel-perfect solutions that users love.
                </p>
                <p className="about-body">
                  With a strong focus on <strong>React & Next.js</strong> on the frontend and{" "}
                  <strong>Supabase</strong> on the backend, I build products that are fast, scalable, and stunning.
                </p>
                <a href="mailto:crowcorpo@gmail.com" className="read-more">Let's talk →</a>
                <div className="skill-pills">
                  {["React","Next.js","JavaScript","CSS3","Supabase","Git","Figma","Node.js"].map((s)=>(
                    <span key={s} className="pill">{s}</span>
                  ))}
                </div>
              </div>
              <div className="about-cards">
                <div className="acard reveal d2">
                  <div className="acard-icon">⚛️</div>
                  <h3>Frontend Development</h3>
                  <p>React, Next.js, JavaScript, HTML5, CSS3 — beautiful responsive interfaces that work on every device.</p>
                </div>
                <div className="acard reveal d3">
                  <div className="acard-icon">🔧</div>
                  <h3>Backend & Database</h3>
                  <p>Supabase, PostgreSQL, REST APIs — reliable, scalable backends that power great products.</p>
                </div>
                <div className="acard reveal d4">
                  <div className="acard-icon">🚀</div>
                  <h3>Performance & SEO</h3>
                  <p>Lighthouse 95+, Core Web Vitals green, structured data — sites that rank and convert.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SERVICES ── */}
        <section id="services">
          <div className="wrap">
            <div className="reveal">
              <span className="eyebrow">What I offer</span>
              <h2 className="s-title">MY<br/><span className="ac">SERVICES</span></h2>
            </div>
            <div className="svc-grid">
              {[
                { n:"01", ico:"🎨", t:"Web Design",       d:"Modern, responsive designs that captivate your audience. Every pixel intentional, every interaction delightful." },
                { n:"02", ico:"💻", t:"Web Development",  d:"Full-stack development with cutting-edge tech. Clean code, solid architecture, built to last." },
                { n:"03", ico:"📱", t:"Mobile Responsive", d:"Pixel-perfect on every screen — phones, tablets, desktops. No compromises on any device." },
                { n:"04", ico:"⚡", t:"Performance",       d:"Lightning-fast load times, Core Web Vitals green. Speed that converts visitors into customers." },
              ].map((s,i)=>(
                <div key={s.n} className={`svc-card reveal d${i+1}`}>
                  <span className="svc-num">{s.n}</span>
                  <span className="svc-ico">{s.ico}</span>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROJECTS ── */}
        <section id="projects">
          <div className="wrap">
            <div className="reveal">
              <span className="eyebrow">My work</span>
              <h2 className="s-title">FEATURED<br/><span className="ac">PROJECTS</span></h2>
            </div>
            <div className="proj-grid">
              {[
                { cls:"pi1", title:"E-Commerce Platform", desc:"Full-featured online store with custom hero animation, seamless checkout, and real-time inventory.", tags:["React","Next.js","Supabase"] },
                { cls:"pi2", title:"Portfolio Website",   desc:"Stunning creative portfolio with smooth scroll animations, GSAP transitions, and a bold aesthetic.", tags:["React","CSS3","GSAP"] },
                { cls:"pi3", title:"Task Manager App",    desc:"Intuitive productivity tool with real-time collaboration, drag-and-drop, and team workspaces.",   tags:["React","Firebase","Tailwind"] },
              ].map((p,i)=>(
                <div key={p.title} className={`proj-card reveal-scale d${i+1}`}>
                  <div className={`proj-img ${p.cls}`}>
                    <div className="proj-img-inner">
                      <button className="proj-view">View Project</button>
                    </div>
                  </div>
                  <div className="proj-info">
                    <h3>{p.title}</h3>
                    <p>{p.desc}</p>
                    <div className="proj-tags">{p.tags.map((t)=><span key={t}>{t}</span>)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BLOG ── */}
        <section id="blog">
          <div className="wrap">
            <div className="reveal">
              <span className="eyebrow">Thoughts</span>
              <h2 className="s-title">LATEST<br/><span className="ac">POSTS</span></h2>
            </div>
            <div className="blog-grid">
              {[
                { date:"Feb 5, 2026",  title:"Modern CSS Techniques for 2026",    desc:"Exploring the latest CSS features revolutionizing web design — container queries, cascade layers, and beyond." },
                { date:"Jan 28, 2026", title:"React Performance Optimization",    desc:"Proven strategies to make your React apps blazing fast — code splitting, memoization, and lazy loading." },
                { date:"Jan 15, 2026", title:"The Future of Web Development",     desc:"A deep dive into emerging trends and technologies shaping the web in 2026 and beyond." },
              ].map((b,i)=>(
                <article key={b.title} className={`blog-card reveal d${i+1}`}>
                  <div className="blog-date">{b.date}</div>
                  <h3>{b.title}</h3>
                  <p>{b.desc}</p>
                  <a href="#" className="read-more">Read More →</a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── CONTACT ── */}
        <section id="contact">
          <div className="wrap">
            <div className="reveal">
              <span className="eyebrow">Say hello</span>
              <h2 className="s-title">GET IN<br/><span className="ac">TOUCH</span></h2>
            </div>
            <div className="contact-grid">
              <div className="contact-left reveal-left">
                <h3>Let's build something amazing together</h3>
                <p>Have a project in mind? Drop me a message and let's create something exceptional.</p>
                <div className="c-methods">
                  <div className="c-method"><span className="c-ico">📧</span><div><h4>Email</h4><p>crowcorpo@gmail.com</p></div></div>
                  <div className="c-method"><span className="c-ico">💼</span><div><h4>Fiverr</h4><p>fiverr.com/corpo</p></div></div>
                  <div className="c-method"><span className="c-ico">📍</span><div><h4>Location</h4><p>Remote — Worldwide</p></div></div>
                </div>
              </div>
              <div className="reveal-right">
                <div className="c-form">
                  <input  className="c-input" type="text"  placeholder="Your Name" />
                  <input  className="c-input" type="email" placeholder="Your Email" />
                  <input  className="c-input" type="text"  placeholder="Project Type" />
                  <textarea className="c-input" placeholder="Tell me about your project..." />
                  <button className="c-submit">Send Message →</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer>
        <div className="foot-inner">
          <p>© 2026 CORPO. All rights reserved.</p>
          <div className="socials">
            <a href="https://www.instagram.com/corpo.crow?igsh=dndqbTV5bHhscGcz">Instagram</a>
            <a href="https://www.tiktok.com/@corpo.crow?_r=1&_t=ZS-93oVKO1JL7N">TikTok</a>
            <a href="https://www.facebook.com/share/14UwmeT7U2K/">Facebook</a>
          </div>
        </div>
      </footer>
    </>
  );
}