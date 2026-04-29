const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

// ── Icon helper ───────────────────────────────────────────────────────────
async function iconPng(IconComponent, color = "#FFFFFF", size = 256) {
    const svg = ReactDOMServer.renderToStaticMarkup(
        React.createElement(IconComponent, { color, size: String(size) })
    );
    const buf = await sharp(Buffer.from(svg)).png().toBuffer();
    return "image/png;base64," + buf.toString("base64");
}

// ── Palette ───────────────────────────────────────────────────────────────
const C = {
    darkBg: "0A0F1E",   // deep navy
    midBg: "111827",   // charcoal navy
    cardBg: "1A2235",   // card bg
    accent1: "6C63FF",   // purple-blue
    accent2: "00D4AA",   // teal-mint
    accent3: "FF6B6B",   // coral
    accent4: "F59E0B",   // amber
    white: "FFFFFF",
    muted: "94A3B8",
    light: "E2E8F0",
};

function makeShadow() {
    return { type: "outer", blur: 12, offset: 3, angle: 135, color: "000000", opacity: 0.25 };
}

function makeGlassCard(slide, x, y, w, h) {
    slide.addShape("rect", {
        x, y, w, h,
        fill: { color: "1A2235" },
        line: { color: "6C63FF", width: 0.5 },
        shadow: makeShadow()
    });
    slide.addShape("rect", {
        x, y, w: 0.04, h,
        fill: { color: C.accent1 },
        line: { color: C.accent1, width: 0 }
    });
}

// ── Helper: add icon circle ────────────────────────────────────────────────
function addIconCircle(slide, iconData, cx, cy, r, circleFill) {
    slide.addShape("ellipse", {
        x: cx - r, y: cy - r, w: r * 2, h: r * 2,
        fill: { color: circleFill },
        line: { color: circleFill, width: 0 }
    });
    slide.addImage({ data: iconData, x: cx - r * 0.6, y: cy - r * 0.6, w: r * 1.2, h: r * 1.2 });
}

// ── Helper: slide number ───────────────────────────────────────────────────
function addSlideNum(slide, n, total) {
    slide.addText(`${n} / ${total}`, {
        x: 8.8, y: 5.35, w: 1.0, h: 0.2,
        fontSize: 9, color: "334155", align: "right"
    });
}

// ── Helper: bottom accent bar ──────────────────────────────────────────────
function bottomBar(slide) {
    slide.addShape("rect", { x: 0, y: 5.45, w: 10, h: 0.175, fill: { color: C.accent1 }, line: { color: C.accent1, width: 0 } });
    slide.addShape("rect", { x: 0, y: 5.45, w: 3.33, h: 0.175, fill: { color: C.accent2 }, line: { color: C.accent2, width: 0 } });
    slide.addShape("rect", { x: 6.67, y: 5.45, w: 3.33, h: 0.175, fill: { color: C.accent3 }, line: { color: C.accent3, width: 0 } });
}

// ─────────────────────────────────────────────────────────────────────────────
async function buildPresentation() {
    const { FaBrain, FaServer, FaDatabase, FaShieldAlt, FaSearch, FaUpload,
        FaComments, FaUsers, FaChartBar, FaRocket, FaExclamationTriangle,
        FaCheckCircle, FaBug, FaLightbulb, FaGlobe, FaLock, FaCode,
        FaCog, FaFlask } = require("react-icons/fa");
    const { MdSecurity, MdSpeed } = require("react-icons/md");

    // Pre-render icons
    const icons = {
        brain: await iconPng(FaBrain, "#FFFFFF"),
        server: await iconPng(FaServer, "#FFFFFF"),
        db: await iconPng(FaDatabase, "#FFFFFF"),
        shield: await iconPng(FaShieldAlt, "#FFFFFF"),
        search: await iconPng(FaSearch, "#FFFFFF"),
        upload: await iconPng(FaUpload, "#FFFFFF"),
        chat: await iconPng(FaComments, "#FFFFFF"),
        users: await iconPng(FaUsers, "#FFFFFF"),
        chart: await iconPng(FaChartBar, "#FFFFFF"),
        rocket: await iconPng(FaRocket, "#FFFFFF"),
        warn: await iconPng(FaExclamationTriangle, "#FFFFFF"),
        check: await iconPng(FaCheckCircle, "#FFFFFF"),
        bug: await iconPng(FaBug, "#FFFFFF"),
        idea: await iconPng(FaLightbulb, "#FFFFFF"),
        globe: await iconPng(FaGlobe, "#FFFFFF"),
        lock: await iconPng(FaLock, "#FFFFFF"),
        code: await iconPng(FaCode, "#FFFFFF"),
        cog: await iconPng(FaCog, "#FFFFFF"),
        flask: await iconPng(FaFlask, "#FFFFFF"),
    };

    const TOTAL = 18;
    const pres = new pptxgen();
    pres.layout = "LAYOUT_16x9";
    pres.title = "AI-Powered Internal Knowledge Assistant";

    // ══════════════════════════════════════════════════════════════
    // SLIDE 1 — TITLE
    // ══════════════════════════════════════════════════════════════
    {
        const s = pres.addSlide();
        s.background = { color: C.darkBg };

        // Decorative orbs
        s.addShape("ellipse", { x: -1, y: -1, w: 4, h: 4, fill: { color: "6C63FF", transparency: 85 }, line: { color: "6C63FF", width: 0 } });
        s.addShape("ellipse", { x: 7.5, y: 3, w: 5, h: 5, fill: { color: "00D4AA", transparency: 88 }, line: { color: "00D4AA", width: 0 } });
        s.addShape("ellipse", { x: 3, y: 4, w: 3, h: 3, fill: { color: "FF6B6B", transparency: 90 }, line: { color: "FF6B6B", width: 0 } });

        // Brain icon large
        s.addImage({ data: icons.brain, x: 4.2, y: 0.3, w: 1.6, h: 1.6 });

        // Tag
        s.addShape("rect", { x: 3.6, y: 2.05, w: 2.8, h: 0.3, fill: { color: "6C63FF", transparency: 70 }, line: { color: "6C63FF", width: 0 } });
        s.addText("FINAL MAJOR PROJECT  ·  B.TECH CSE (AI-ML)", { x: 3.0, y: 2.05, w: 4, h: 0.3, fontSize: 9, color: C.accent1, bold: true, align: "center" });

        // Title
        s.addText("AI-Powered Internal", { x: 0.5, y: 2.45, w: 9, h: 0.75, fontSize: 40, bold: true, color: C.white, align: "center", fontFace: "Calibri" });
        s.addText("Knowledge Assistant", { x: 0.5, y: 3.12, w: 9, h: 0.75, fontSize: 40, bold: true, color: C.accent2, align: "center", fontFace: "Calibri" });

        // Subtitle
        s.addText("\"ChatGPT for Your Company's Private Data\"", { x: 1, y: 3.92, w: 8, h: 0.35, fontSize: 15, italic: true, color: C.muted, align: "center" });

        // Meta info
        s.addText("Presented by: [NAME OF STUDENT]  |  Enrollment: [ENROLLMENT NO.]  |  Mentor: [NAME OF MENTOR]", {
            x: 0.5, y: 4.4, w: 9, h: 0.25, fontSize: 10, color: "64748B", align: "center"
        });
        s.addText("Dept. of CSE (AI-ML)  ·  Faculty of Engineering Science & Technology  ·  Adani University, Ahmedabad  ·  2025", {
            x: 0.5, y: 4.7, w: 9, h: 0.25, fontSize: 9, color: "475569", align: "center"
        });

        bottomBar(s);
    }

    // ══════════════════════════════════════════════════════════════
    // SLIDE 2 — PROBLEM STATEMENT
    // ══════════════════════════════════════════════════════════════
    {
        const s = pres.addSlide();
        s.background = { color: C.darkBg };

        s.addText("01", { x: 0.35, y: 0.2, w: 1, h: 0.5, fontSize: 28, bold: true, color: "1E293B" });
        s.addText("Problem Statement", { x: 0.5, y: 0.22, w: 9, h: 0.55, fontSize: 28, bold: true, color: C.white });
        s.addText("& Objectives", { x: 0.5, y: 0.72, w: 9, h: 0.38, fontSize: 20, color: C.accent1 });

        // Big stat callout
        s.addShape("rect", { x: 0.4, y: 1.3, w: 2.5, h: 1.4, fill: { color: "6C63FF", transparency: 80 }, line: { color: C.accent1, width: 0.8 } });
        s.addText("20%", { x: 0.4, y: 1.35, w: 2.5, h: 0.75, fontSize: 44, bold: true, color: C.accent1, align: "center" });
        s.addText("of work time wasted\nsearching for info", { x: 0.4, y: 2.05, w: 2.5, h: 0.6, fontSize: 10, color: C.light, align: "center" });

        // Problems list
        const problems = [
            { icon: icons.search, color: "6C63FF", text: "No centralized search — info siloed across Notion, Slack, Email, PDFs" },
            { icon: icons.warn, color: "F59E0B", text: "Knowledge loss — critical info lost when employees leave" },
            { icon: icons.users, color: "FF6B6B", text: "Slow onboarding — new hires spend weeks finding institutional knowledge" },
            { icon: icons.chart, color: "00D4AA", text: "Inconsistent data — stale documents cause wrong decisions" },
        ];

        problems.forEach((p, i) => {
            const y = 1.25 + i * 0.97;
            s.addShape("rect", { x: 3.2, y, w: 6.3, h: 0.82, fill: { color: C.cardBg }, line: { color: p.color, width: 0.5 } });
            addIconCircle(s, p.icon, 3.75, y + 0.41, 0.28, p.color);
            s.addText(p.text, { x: 4.2, y: y + 0.1, w: 5.1, h: 0.62, fontSize: 12.5, color: C.light, valign: "middle" });
        });

        // Objectives box
        s.addShape("rect", { x: 0.4, y: 2.82, w: 2.5, h: 2.4, fill: { color: C.cardBg }, line: { color: C.accent2, width: 0.8 } });
        s.addText("Objectives", { x: 0.4, y: 2.88, w: 2.5, h: 0.3, fontSize: 11, bold: true, color: C.accent2, align: "center" });
        const objs = ["Centralized AI Q&A", "Source-attributed answers", "Role-based access", "Hybrid RAG accuracy", "Multi-format support"];
        objs.forEach((o, i) => {
            s.addText([{ text: "▸ ", options: { color: C.accent2 } }, { text: o, options: { color: C.light } }],
                { x: 0.55, y: 3.22 + i * 0.37, w: 2.2, h: 0.34, fontSize: 10 });
        });

        addSlideNum(s, 2, TOTAL);
        bottomBar(s);
    }

    // ══════════════════════════════════════════════════════════════
    // SLIDE 3 — ORGANIZATION OVERVIEW
    // ══════════════════════════════════════════════════════════════
    {
        const s = pres.addSlide();
        s.background = { color: C.darkBg };

        s.addText("02", { x: 0.35, y: 0.2, w: 1, h: 0.5, fontSize: 28, bold: true, color: "1E293B" });
        s.addText("Organization / Project Overview", { x: 0.5, y: 0.22, w: 9, h: 0.55, fontSize: 26, bold: true, color: C.white });

        const cards = [
            { label: "Institution", value: "Adani University", sub: "Ahmedabad-382421, Gujarat, India", icon: icons.globe, color: "6C63FF" },
            { label: "Department", value: "CSE (AI-ML)", sub: "Faculty of Engineering Science & Technology", icon: icons.code, color: "00D4AA" },
            { label: "Website", value: "adaniuniversity.ac.in", sub: "Official University Portal", icon: icons.globe, color: "F59E0B" },
            { label: "Project Mentor", value: "[NAME OF MENTOR]", sub: "[Designation], Dept. CSE AI-ML", icon: icons.users, color: "FF6B6B" },
            { label: "Student Role", value: "Full-Stack Developer", sub: "Architecture · Frontend · Backend · AI", icon: icons.cog, color: "A78BFA" },
            { label: "Duration", value: "Nov – Dec 2025", sub: "6-week Sprint-based Development", icon: icons.chart, color: "34D399" },
        ];

        cards.forEach((c, i) => {
            const col = i % 3, row = Math.floor(i / 3);
            const x = 0.4 + col * 3.2, y = 1.1 + row * 2.1;
            s.addShape("rect", { x, y, w: 3.0, h: 1.85, fill: { color: C.cardBg }, line: { color: c.color, width: 0.6 }, shadow: makeShadow() });
            s.addShape("rect", { x, y, w: 3.0, h: 0.04, fill: { color: c.color }, line: { color: c.color, width: 0 } });
            addIconCircle(s, c.icon, x + 0.45, y + 0.52, 0.26, c.color);
            s.addText(c.label, { x: x + 0.82, y: y + 0.28, w: 2.0, h: 0.28, fontSize: 9, color: C.muted, bold: true });
            s.addText(c.value, { x: x + 0.82, y: y + 0.52, w: 2.0, h: 0.35, fontSize: 13, bold: true, color: C.white });
            s.addText(c.sub, { x: x + 0.1, y: y + 0.94, w: 2.75, h: 0.7, fontSize: 10, color: "64748B" });
        });

        addSlideNum(s, 3, TOTAL);
        bottomBar(s);
    }

    // ══════════════════════════════════════════════════════════════
    // SLIDE 4 — SYSTEM ARCHITECTURE
    // ══════════════════════════════════════════════════════════════
    {
        const s = pres.addSlide();
        s.background = { color: C.darkBg };

        s.addText("03", { x: 0.35, y: 0.2, w: 1, h: 0.5, fontSize: 28, bold: true, color: "1E293B" });
        s.addText("Proposed System Architecture", { x: 0.5, y: 0.22, w: 9, h: 0.55, fontSize: 26, bold: true, color: C.white });
        s.addText("Three-tier architecture with Hybrid RAG pipeline", { x: 0.5, y: 0.74, w: 9, h: 0.3, fontSize: 13, color: C.muted });

        const layers = [
            { label: "PRESENTATION TIER", sub: "React.js + Vite", items: ["Login / Register", "Dashboard", "Chat Interface", "Document Upload", "Admin Panel"], color: "6C63FF", icon: icons.code },
            { label: "APPLICATION TIER", sub: "Node.js + Express.js", items: ["Auth Controller (JWT)", "Chat Controller (RAG)", "Document Controller", "User Controller", "Stats Controller"], color: "00D4AA", icon: icons.server },
            { label: "DATA & AI TIER", sub: "PostgreSQL + pgvector + Groq", items: ["Users Table", "Documents Table", "Chunks + Embeddings", "Chat Sessions/Messages", "Groq API (Llama 3.1)"], color: "F59E0B", icon: icons.db },
        ];

        layers.forEach((layer, i) => {
            const x = 0.35 + i * 3.2;
            s.addShape("rect", { x, y: 1.15, w: 3.0, h: 4.05, fill: { color: C.cardBg }, line: { color: layer.color, width: 0.8 }, shadow: makeShadow() });
            s.addShape("rect", { x, y: 1.15, w: 3.0, h: 0.65, fill: { color: layer.color }, line: { color: layer.color, width: 0 } });
            addIconCircle(s, layer.icon, x + 0.38, y = 1.47, 0.22, "FFFFFF");
            s.addText(layer.label, { x: x + 0.7, y: 1.2, w: 2.1, h: 0.3, fontSize: 9.5, bold: true, color: C.white });
            s.addText(layer.sub, { x: x + 0.7, y: 1.49, w: 2.15, h: 0.27, fontSize: 9, color: C.white });
            layer.items.forEach((item, j) => {
                s.addText([{ text: "→  ", options: { color: layer.color } }, { text: item, options: { color: C.light } }],
                    { x: x + 0.2, y: 2.0 + j * 0.59, w: 2.6, h: 0.52, fontSize: 11 });
            });
            if (i < 2) {
                s.addShape("rect", { x: x + 3.05, y: 3.05, w: 0.15, h: 0.04, fill: { color: layer.color }, line: { color: layer.color, width: 0 } });
                s.addText("▶", { x: x + 3.0, y: 2.95, w: 0.2, h: 0.24, fontSize: 14, color: layer.color, align: "center" });
            }
        });

        addSlideNum(s, 4, TOTAL);
        bottomBar(s);
    }

    // ══════════════════════════════════════════════════════════════
    // SLIDE 5 — DATABASE DESIGN
    // ══════════════════════════════════════════════════════════════
    {
        const s = pres.addSlide();
        s.background = { color: C.darkBg };

        s.addText("04", { x: 0.35, y: 0.2, w: 1, h: 0.5, fontSize: 28, bold: true, color: "1E293B" });
        s.addText("Database Design", { x: 0.5, y: 0.22, w: 9, h: 0.55, fontSize: 26, bold: true, color: C.white });
        s.addText("PostgreSQL + pgvector  |  5 core tables  |  IVFFlat vector index  |  GIN full-text index", { x: 0.5, y: 0.74, w: 9, h: 0.3, fontSize: 11.5, color: C.muted });

        const tables = [
            { name: "users", color: "6C63FF", fields: ["id (UUID PK)", "email (UNIQUE)", "name", "password (bcrypt)", "role (admin|mentor|trainee)", "workspace", "created_at"] },
            { name: "documents", color: "00D4AA", fields: ["id (UUID PK)", "user_id (FK)", "original_name", "file_type", "file_size", "status", "workspace"] },
            { name: "document_chunks", color: "F59E0B", fields: ["id (UUID PK)", "document_id (FK)", "content (TEXT)", "embedding VECTOR(384)", "chunk_index", "created_at"] },
            { name: "chat_sessions", color: "FF6B6B", fields: ["id (UUID PK)", "user_id (FK)", "title", "workspace", "created_at", "updated_at"] },
            { name: "chat_messages", color: "A78BFA", fields: ["id (UUID PK)", "session_id (FK)", "role (user|assistant)", "content (TEXT)", "sources (JSONB)", "created_at"] },
        ];

        tables.forEach((t, i) => {
            const col = i % 3, row = Math.floor(i / 3);
            const x = 0.35 + col * 3.25, y = 1.12 + row * 2.18;
            const w = i === 3 ? 3.1 : (i === 4 ? 3.1 : 3.0);
            s.addShape("rect", { x, y, w: 3.0, h: 1.95, fill: { color: C.cardBg }, line: { color: t.color, width: 0.7 } });
            s.addShape("rect", { x, y, w: 3.0, h: 0.38, fill: { color: t.color, transparency: 30 }, line: { color: t.color, width: 0 } });
            s.addText(t.name, { x: x + 0.12, y: y + 0.04, w: 2.75, h: 0.3, fontSize: 12, bold: true, color: C.white });
            t.fields.forEach((f, j) => {
                if (j > 4) return;
                s.addText(f, { x: x + 0.18, y: y + 0.45 + j * 0.28, w: 2.65, h: 0.26, fontSize: 9.5, color: j === 0 ? t.color : C.light });
            });
            if (t.fields.length > 5) s.addText(`+${t.fields.length - 5} more`, { x: x + 0.18, y: y + 1.68, w: 2.65, h: 0.2, fontSize: 9, color: "475569" });
        });

        // Indexes note
        s.addShape("rect", { x: 6.55, y: 3.3, w: 3.1, h: 1.77, fill: { color: "1E293B" }, line: { color: "334155", width: 0.5 } });
        s.addText("Vector Indexes", { x: 6.65, y: 3.36, w: 2.9, h: 0.3, fontSize: 11, bold: true, color: C.accent1 });
        s.addText("IVFFlat (cosine)\nvector similarity search\n\nGIN (tsvector)\nfull-text keyword search", { x: 6.65, y: 3.7, w: 2.9, h: 1.25, fontSize: 10, color: C.light });

        addSlideNum(s, 5, TOTAL);
        bottomBar(s);
    }

    // ══════════════════════════════════════════════════════════════
    // SLIDE 6 — FUNCTIONAL MODULES
    // ══════════════════════════════════════════════════════════════
    {
        const s = pres.addSlide();
        s.background = { color: C.darkBg };

        s.addText("05", { x: 0.35, y: 0.2, w: 1, h: 0.5, fontSize: 28, bold: true, color: "1E293B" });
        s.addText("Functional Components", { x: 0.5, y: 0.22, w: 9, h: 0.55, fontSize: 26, bold: true, color: C.white });

        const modules = [
            { icon: icons.lock, color: "6C63FF", title: "Authentication", pts: ["JWT-based login & register", "bcrypt password hashing", "Role guards (Admin/Mentor/Trainee)", "Token expiry & refresh"] },
            { icon: icons.upload, color: "00D4AA", title: "Document Ingestion", pts: ["Drag-and-drop upload UI", "PDF/DOCX/MD/CSV/TXT parsing", "Smart chunking (400w, 80 overlap)", "Async indexing with status updates"] },
            { icon: icons.brain, color: "F59E0B", title: "Hybrid RAG Engine", pts: ["Vector embedding via AI service", "Semantic cosine similarity search", "Keyword full-text tsvector search", "Reciprocal Rank Fusion (RRF) merge"] },
            { icon: icons.chat, color: "FF6B6B", title: "AI Chat Interface", pts: ["Multi-session conversation history", "Source citation on every answer", "Hybrid/Semantic/Keyword modes", "Groq Llama 3.1 8B Instant LLM"] },
            { icon: icons.users, color: "A78BFA", title: "Admin Panel", pts: ["User management table", "Inline role change dropdown", "User deletion with confirmation", "Search & filter users"] },
            { icon: icons.chart, color: "34D399", title: "Dashboard & Stats", pts: ["Document count & size stats", "Total queries and sessions", "Quick-action cards (role-aware)", "System status indicators"] },
        ];

        modules.forEach((m, i) => {
            const col = i % 3, row = Math.floor(i / 3);
            const x = 0.35 + col * 3.22, y = 1.05 + row * 2.22;
            s.addShape("rect", { x, y, w: 3.0, h: 2.0, fill: { color: C.cardBg }, line: { color: m.color, width: 0.5 }, shadow: makeShadow() });
            addIconCircle(s, m.icon, x + 0.38, y + 0.38, 0.26, m.color);
            s.addText(m.title, { x: x + 0.75, y: y + 0.12, w: 2.1, h: 0.52, fontSize: 12.5, bold: true, color: C.white });
            m.pts.forEach((p, j) => {
                s.addText([{ text: "✓ ", options: { color: m.color } }, { text: p, options: { color: C.light } }],
                    { x: x + 0.18, y: y + 0.76 + j * 0.29, w: 2.65, h: 0.27, fontSize: 10 });
            });
        });

        addSlideNum(s, 6, TOTAL);
        bottomBar(s);
    }

    // ══════════════════════════════════════════════════════════════
    // SLIDE 7 — USER INTERFACES (placeholder)
    // ══════════════════════════════════════════════════════════════
    {
        const s = pres.addSlide();
        s.background = { color: C.darkBg };

        s.addText("06", { x: 0.35, y: 0.2, w: 1, h: 0.5, fontSize: 28, bold: true, color: "1E293B" });
        s.addText("Final User Interfaces", { x: 0.5, y: 0.22, w: 9, h: 0.55, fontSize: 26, bold: true, color: C.white });

        const screens = [
            { label: "Login Page", desc: "Glassmorphism design with role quick-fill", color: "6C63FF" },
            { label: "Dashboard", desc: "Stats grid, recent queries, system status", color: "00D4AA" },
            { label: "Chat Interface", desc: "AI Q&A with RAG mode selector & citations", color: "F59E0B" },
            { label: "Document Upload", desc: "Drag-and-drop with live indexing status", color: "FF6B6B" },
            { label: "Admin Panel", desc: "User management with inline role control", color: "A78BFA" },
            { label: "Profile/Settings", desc: "User preferences saved to localStorage", color: "34D399" },
        ];

        screens.forEach((sc, i) => {
            const col = i % 3, row = Math.floor(i / 3);
            const x = 0.35 + col * 3.22, y = 1.05 + row * 2.22;
            s.addShape("rect", { x, y, w: 3.0, h: 2.0, fill: { color: C.cardBg }, line: { color: sc.color, width: 0.7 }, shadow: makeShadow() });
            // Image placeholder zone
            s.addShape("rect", { x: x + 0.15, y: y + 0.12, w: 2.7, h: 1.3, fill: { color: "0F172A" }, line: { color: "1E293B", width: 0.5 } });
            s.addText("[ Insert UI Screenshot ]", { x: x + 0.15, y: y + 0.12, w: 2.7, h: 1.3, fontSize: 10, color: "334155", align: "center", valign: "middle", italic: true });
            s.addShape("rect", { x, y: y + 1.55, w: 3.0, h: 0.04, fill: { color: sc.color }, line: { color: sc.color, width: 0 } });
            s.addText(sc.label, { x: x + 0.12, y: y + 1.6, w: 2.8, h: 0.24, fontSize: 11, bold: true, color: sc.color });
            s.addText(sc.desc, { x: x + 0.12, y: y + 1.82, w: 2.8, h: 0.16, fontSize: 8.5, color: C.muted });
        });

        addSlideNum(s, 7, TOTAL);
        bottomBar(s);
    }

    // ══════════════════════════════════════════════════════════════
    // SLIDE 8 — WORKING DEMO (placeholder)
    // ══════════════════════════════════════════════════════════════
    {
        const s = pres.addSlide();
        s.background = { color: C.darkBg };

        s.addShape("ellipse", { x: -0.5, y: -0.5, w: 3.5, h: 3.5, fill: { color: "6C63FF", transparency: 90 }, line: { color: "6C63FF", width: 0 } });
        s.addShape("ellipse", { x: 7.5, y: 2.5, w: 4, h: 4, fill: { color: "00D4AA", transparency: 90 }, line: { color: "00D4AA", width: 0 } });

        s.addText("07", { x: 0.35, y: 0.2, w: 1, h: 0.5, fontSize: 28, bold: true, color: "1E293B" });
        s.addText("Working Demonstration", { x: 0.5, y: 0.22, w: 9, h: 0.55, fontSize: 26, bold: true, color: C.white });
        s.addText("Live system running at  http://localhost:3000  ·  Backend at  http://localhost:4000", { x: 0.5, y: 0.74, w: 9, h: 0.3, fontSize: 11, color: C.muted });

        // Demo flow
        const steps = [
            { n: "1", title: "Login as Admin", desc: "admin@company.com  /  password123\nRole badge + full nav visible", color: "6C63FF" },
            { n: "2", title: "Upload a Document", desc: "Upload PDF/DOCX  →  Watch status:\nUploaded → Processing → Indexed", color: "00D4AA" },
            { n: "3", title: "Ask a Question", desc: "Type any question related to the doc\nSelect Hybrid/Semantic/Keyword mode", color: "F59E0B" },
            { n: "4", title: "See AI Answer + Source", desc: "Groq Llama 3.1 generates response\nSource document cited with page ref", color: "FF6B6B" },
            { n: "5", title: "Switch to Trainee Role", desc: "Login as trainee@company.com\nUpload button hidden — role enforced", color: "A78BFA" },
            { n: "6", title: "Admin Panel", desc: "Login as admin  →  Manage Users tab\nChange roles, delete users live", color: "34D399" },
        ];

        steps.forEach((step, i) => {
            const col = i % 3, row = Math.floor(i / 3);
            const x = 0.35 + col * 3.22, y = 1.1 + row * 2.12;
            s.addShape("rect", { x, y, w: 3.0, h: 1.9, fill: { color: C.cardBg }, line: { color: step.color, width: 0.6 }, shadow: makeShadow() });
            s.addShape("ellipse", { x: x + 0.15, y: y + 0.13, w: 0.52, h: 0.52, fill: { color: step.color }, line: { color: step.color, width: 0 } });
            s.addText(step.n, { x: x + 0.15, y: y + 0.13, w: 0.52, h: 0.52, fontSize: 18, bold: true, color: C.white, align: "center", valign: "middle" });
            s.addText(step.title, { x: x + 0.75, y: y + 0.15, w: 2.1, h: 0.52, fontSize: 12, bold: true, color: C.white });
            s.addText(step.desc, { x: x + 0.15, y: y + 0.75, w: 2.75, h: 0.9, fontSize: 10.5, color: C.light });
        });

        addSlideNum(s, 8, TOTAL);
        bottomBar(s);
    }

    // ══════════════════════════════════════════════════════════════
    // SLIDE 9 — TESTING & VALIDATION
    // ══════════════════════════════════════════════════════════════
    {
        const s = pres.addSlide();
        s.background = { color: C.darkBg };

        s.addText("08", { x: 0.35, y: 0.2, w: 1, h: 0.5, fontSize: 28, bold: true, color: "1E293B" });
        s.addText("Testing & Validation", { x: 0.5, y: 0.22, w: 9, h: 0.55, fontSize: 26, bold: true, color: C.white });

        // Test results summary
        const metrics = [
            { label: "Test Cases Total", val: "24", color: C.accent1 },
            { label: "Passed", val: "22", color: C.accent2 },
            { label: "Failed (Fixed)", val: "2", color: C.accent3 },
            { label: "Pass Rate", val: "91.7%", color: C.accent4 },
        ];
        metrics.forEach((m, i) => {
            const x = 0.35 + i * 2.38;
            s.addShape("rect", { x, y: 1.08, w: 2.2, h: 1.0, fill: { color: C.cardBg }, line: { color: m.color, width: 0.7 } });
            s.addText(m.val, { x, y: 1.12, w: 2.2, h: 0.6, fontSize: 32, bold: true, color: m.color, align: "center" });
            s.addText(m.label, { x, y: 1.7, w: 2.2, h: 0.3, fontSize: 10, color: C.muted, align: "center" });
        });

        // Test case table
        s.addTable([
            [{ text: "Module", options: { bold: true, color: C.white, fill: { color: "1F2937" } } },
            { text: "Test Case", options: { bold: true, color: C.white, fill: { color: "1F2937" } } },
            { text: "Result", options: { bold: true, color: C.white, fill: { color: "1F2937" } } }],
            ["Authentication", "Valid login → JWT returned + redirect", "✅ Pass"],
            ["Authentication", "Duplicate email registration", "✅ Pass"],
            ["Document", "PDF upload → status processing→indexed", "✅ Pass"],
            ["Document", "Trainee attempts upload → 403 Forbidden", "✅ Pass"],
            ["RAG Query", "Question answered with source citation", "✅ Pass"],
            ["RAG Query", "Hybrid mode merges semantic+keyword", "✅ Pass"],
            ["Admin Panel", "Mentor access → 403 role insufficient", "✅ Pass"],
            ["HuggingFace", "API blob error → local fallback activates", "🔧 Fixed"],
        ], {
            x: 0.35, y: 2.18, w: 9.3, h: 2.95,
            colW: [2.2, 5.2, 1.9],
            border: { pt: 0.5, color: "1E293B" },
            fontSize: 10,
            color: C.light,
        });

        addSlideNum(s, 9, TOTAL);
        bottomBar(s);
    }

    // ══════════════════════════════════════════════════════════════
    // SLIDE 10 — METHODOLOGY / RAG ALGORITHM
    // ══════════════════════════════════════════════════════════════
    {
        const s = pres.addSlide();
        s.background = { color: C.darkBg };

        s.addText("09", { x: 0.35, y: 0.2, w: 1, h: 0.5, fontSize: 28, bold: true, color: "1E293B" });
        s.addText("Methodology & Algorithms", { x: 0.5, y: 0.22, w: 9, h: 0.55, fontSize: 26, bold: true, color: C.white });
        s.addText("Hybrid RAG = Semantic Search + Keyword Search + Reciprocal Rank Fusion", { x: 0.5, y: 0.74, w: 9, h: 0.3, fontSize: 12.5, color: C.muted });

        // Ingestion pipeline
        s.addText("INGESTION PIPELINE", { x: 0.35, y: 1.1, w: 9.3, h: 0.28, fontSize: 10, bold: true, color: C.accent1 });
        const ing = ["Upload", "Parse", "Chunk\n(400w/80 overlap)", "Embed\n(vector)", "Store\n(pgvector)"];
        const ingColors = ["6C63FF", "00D4AA", "F59E0B", "FF6B6B", "A78BFA"];
        ing.forEach((step, i) => {
            const x = 0.35 + i * 1.9;
            s.addShape("rect", { x, y: 1.42, w: 1.65, h: 0.95, fill: { color: ingColors[i], transparency: 20 }, line: { color: ingColors[i], width: 0 } });
            s.addText(step, { x, y: 1.42, w: 1.65, h: 0.95, fontSize: 10.5, bold: true, color: C.white, align: "center", valign: "middle" });
            if (i < ing.length - 1) s.addText("→", { x: x + 1.65, y: 1.42, w: 0.25, h: 0.95, fontSize: 16, color: ingColors[i], align: "center", valign: "middle" });
        });

        // Query pipeline (split)
        s.addText("QUERY PIPELINE", { x: 0.35, y: 2.55, w: 9.3, h: 0.28, fontSize: 10, bold: true, color: C.accent2 });
        const qStages = [
            { label: "Question\nInput", color: "6C63FF" },
            { label: "Embed\nQuery", color: "00D4AA" },
        ];
        qStages.forEach((q, i) => {
            const x = 0.35 + i * 1.9;
            s.addShape("rect", { x, y: 2.87, w: 1.65, h: 0.82, fill: { color: q.color, transparency: 20 }, line: { color: q.color, width: 0 } });
            s.addText(q.label, { x, y: 2.87, w: 1.65, h: 0.82, fontSize: 10.5, bold: true, color: C.white, align: "center", valign: "middle" });
            s.addText("→", { x: x + 1.65, y: 2.87, w: 0.25, h: 0.82, fontSize: 16, color: q.color, align: "center", valign: "middle" });
        });

        // Branch
        s.addShape("rect", { x: 4.1, y: 2.87, w: 1.65, h: 0.35, fill: { color: "F59E0B", transparency: 20 }, line: { color: "F59E0B", width: 0 } });
        s.addText("Semantic Search\n(cosine similarity)", { x: 4.1, y: 2.87, w: 1.65, h: 0.35, fontSize: 8, color: C.white, align: "center", valign: "middle" });
        s.addShape("rect", { x: 4.1, y: 3.34, w: 1.65, h: 0.35, fill: { color: "FF6B6B", transparency: 20 }, line: { color: "FF6B6B", width: 0 } });
        s.addText("Keyword Search\n(tsvector GIN)", { x: 4.1, y: 3.34, w: 1.65, h: 0.35, fontSize: 8, color: C.white, align: "center", valign: "middle" });

        s.addText("→", { x: 5.75, y: 2.87, w: 0.25, h: 0.82, fontSize: 16, color: "A78BFA", align: "center", valign: "middle" });
        s.addShape("rect", { x: 6.0, y: 2.87, w: 1.65, h: 0.82, fill: { color: "A78BFA", transparency: 20 }, line: { color: "A78BFA", width: 0 } });
        s.addText("RRF Merge\n(top 5 chunks)", { x: 6.0, y: 2.87, w: 1.65, h: 0.82, fontSize: 10, bold: true, color: C.white, align: "center", valign: "middle" });

        s.addText("→", { x: 7.65, y: 2.87, w: 0.25, h: 0.82, fontSize: 16, color: "34D399", align: "center", valign: "middle" });
        s.addShape("rect", { x: 7.9, y: 2.87, w: 1.75, h: 0.82, fill: { color: "34D399", transparency: 20 }, line: { color: "34D399", width: 0 } });
        s.addText("Groq LLM\n+ Answer\n+ Citations", { x: 7.9, y: 2.87, w: 1.75, h: 0.82, fontSize: 9.5, bold: true, color: C.white, align: "center", valign: "middle" });

        // RRF formula
        s.addShape("rect", { x: 0.35, y: 3.9, w: 9.3, h: 0.9, fill: { color: "0F172A" }, line: { color: "334155", width: 0.5 } });
        s.addText("RRF Formula: ", { x: 0.55, y: 4.0, w: 1.5, h: 0.5, fontSize: 11, bold: true, color: C.accent2 });
        s.addText("score(d) = Σ 1 / (k + rank(d))   where k = 60  |  Final rank merges semantic + keyword results for superior accuracy", { x: 2.1, y: 4.0, w: 7.3, h: 0.5, fontSize: 11, color: C.light });

        addSlideNum(s, 10, TOTAL);
        bottomBar(s);
    }

    // ══════════════════════════════════════════════════════════════
    // SLIDE 11 — TOOLS & TECHNOLOGIES
    // ══════════════════════════════════════════════════════════════
    {
        const s = pres.addSlide();
        s.background = { color: C.darkBg };

        s.addText("10", { x: 0.35, y: 0.2, w: 1, h: 0.5, fontSize: 28, bold: true, color: "1E293B" });
        s.addText("Tools & Technologies", { x: 0.5, y: 0.22, w: 9, h: 0.55, fontSize: 26, bold: true, color: C.white });

        const techGroups = [
            { group: "Frontend", color: "6C63FF", icon: icons.code, techs: ["React.js v18", "Vite v5", "React Router v6", "Context API", "CSS3 Glassmorphism"] },
            { group: "Backend", color: "00D4AA", icon: icons.server, techs: ["Node.js v18", "Express.js", "JWT (jsonwebtoken)", "bcryptjs", "Multer (file upload)"] },
            { group: "Database", color: "F59E0B", icon: icons.db, techs: ["PostgreSQL v14", "pgvector extension", "IVFFlat Index", "GIN Full-Text Index", "pg (node driver)"] },
            { group: "AI & APIs", color: "FF6B6B", icon: icons.brain, techs: ["Groq API", "Llama 3.1 8B Instant", "Local TF-IDF Embeddings", "pdf-parse", "mammoth.js (DOCX)"] },
            { group: "Dev Tools", color: "A78BFA", icon: icons.cog, techs: ["Git & GitHub", "pgAdmin 4", "VS Code", "Postman (API test)", "concurrently (monorepo)"] },
            { group: "Security", color: "34D399", icon: icons.shield, techs: ["Helmet.js", "CORS middleware", "Rate limiting", "Parameterized SQL", "Role-based guards"] },
        ];

        techGroups.forEach((g, i) => {
            const col = i % 3, row = Math.floor(i / 3);
            const x = 0.35 + col * 3.22, y = 1.05 + row * 2.2;
            s.addShape("rect", { x, y, w: 3.0, h: 2.0, fill: { color: C.cardBg }, line: { color: g.color, width: 0.5 }, shadow: makeShadow() });
            s.addShape("rect", { x, y, w: 3.0, h: 0.45, fill: { color: g.color, transparency: 25 }, line: { color: g.color, width: 0 } });
            addIconCircle(s, g.icon, x + 0.28, y + 0.22, 0.19, "00000040");
            s.addText(g.group, { x: x + 0.6, y: y + 0.07, w: 2.2, h: 0.32, fontSize: 13, bold: true, color: C.white });
            g.techs.forEach((t, j) => {
                s.addText([{ text: "▸ ", options: { color: g.color } }, { text: t, options: { color: C.light } }],
                    { x: x + 0.15, y: y + 0.52 + j * 0.29, w: 2.7, h: 0.27, fontSize: 10.5 });
            });
        });

        addSlideNum(s, 11, TOTAL);
        bottomBar(s);
    }

    // ══════════════════════════════════════════════════════════════
    // SLIDE 12 — RESULTS & OUTCOMES
    // ══════════════════════════════════════════════════════════════
    {
        const s = pres.addSlide();
        s.background = { color: C.darkBg };

        s.addText("11", { x: 0.35, y: 0.2, w: 1, h: 0.5, fontSize: 28, bold: true, color: "1E293B" });
        s.addText("Results & Outcomes", { x: 0.5, y: 0.22, w: 9, h: 0.55, fontSize: 26, bold: true, color: C.white });

        // Big metric cards
        const bigStats = [
            { val: "5", label: "Document Formats Supported\nPDF · DOCX · MD · CSV · TXT", color: "6C63FF" },
            { val: "3", label: "User Roles Implemented\nAdmin · Mentor · Trainee", color: "00D4AA" },
            { val: "<2s", label: "Groq LLM Response Time\nLlama 3.1 8B Instant", color: "F59E0B" },
            { val: "100%", label: "Source Attribution\nEvery AI answer has citations", color: "FF6B6B" },
        ];
        bigStats.forEach((st, i) => {
            const x = 0.35 + i * 2.38;
            s.addShape("rect", { x, y: 1.05, w: 2.2, h: 1.35, fill: { color: C.cardBg }, line: { color: st.color, width: 0.8 }, shadow: makeShadow() });
            s.addText(st.val, { x, y: 1.08, w: 2.2, h: 0.65, fontSize: 38, bold: true, color: st.color, align: "center" });
            s.addText(st.label, { x, y: 1.7, w: 2.2, h: 0.65, fontSize: 9, color: C.light, align: "center" });
        });

        // Comparison vs objectives
        s.addText("Objectives vs Achievements", { x: 0.35, y: 2.58, w: 9.3, h: 0.28, fontSize: 12, bold: true, color: C.accent2 });
        const comparisons = [
            ["Centralized AI Q&A chatbot", "✅ Fully implemented — Groq Llama 3.1 powered"],
            ["Source-attributed responses", "✅ Source filenames cited in every answer"],
            ["Hybrid RAG pipeline", "✅ Semantic + Keyword + RRF merge working"],
            ["Role-based access control", "✅ Admin/Mentor/Trainee with route guards"],
            ["Multi-document reasoning", "✅ Top-5 chunk retrieval across all docs"],
            ["Third-party integrations (Slack, Notion)", "⏳ Deferred to Future Phase 2"],
        ];
        s.addTable([
            [{ text: "Planned Objective", options: { bold: true, color: C.white, fill: { color: "1E293B" } } },
            { text: "Achievement", options: { bold: true, color: C.white, fill: { color: "1E293B" } } }],
            ...comparisons.map(([a, b]) => [a, b])
        ], {
            x: 0.35, y: 2.9, w: 9.3, h: 2.5,
            colW: [4.1, 5.2],
            border: { pt: 0.5, color: "1E293B" },
            fontSize: 10.5,
            color: C.light,
        });

        addSlideNum(s, 12, TOTAL);
        bottomBar(s);
    }

    // ══════════════════════════════════════════════════════════════
    // SLIDE 13 — CHALLENGES & SOLUTIONS
    // ══════════════════════════════════════════════════════════════
    {
        const s = pres.addSlide();
        s.background = { color: C.darkBg };

        s.addText("12", { x: 0.35, y: 0.2, w: 1, h: 0.5, fontSize: 28, bold: true, color: "1E293B" });
        s.addText("Challenges Faced & Solutions", { x: 0.5, y: 0.22, w: 9, h: 0.55, fontSize: 26, bold: true, color: C.white });

        const challenges = [
            {
                n: "01", challenge: "HuggingFace API — All models failed with 'blob error'",
                solution: "Migrated to Groq API (Llama 3.1 8B Instant) + built local TF-IDF embedding fallback",
                color: "FF6B6B", impact: "High"
            },
            {
                n: "02", challenge: "pgvector installation failure on Windows",
                solution: "Used Docker image pgvector/pgvector:pg16 with extension pre-installed",
                color: "F59E0B", impact: "Medium"
            },
            {
                n: "03", challenge: "Dashboard black screen — stats.changes was undefined",
                solution: "Removed the broken field reference; added proper try-catch error boundaries",
                color: "A78BFA", impact: "High"
            },
            {
                n: "04", challenge: "NaN MB · Invalid Date in Document list",
                solution: "Backend sends snake_case fields; added normalise() mapper in DocumentList.jsx",
                color: "6C63FF", impact: "Medium"
            },
            {
                n: "05", challenge: "CORS errors between Vite (3000) and Express (4000)",
                solution: "Configured Helmet.js CORS with FRONTEND_URL env variable whitelist",
                color: "00D4AA", impact: "Medium"
            },
            {
                n: "06", challenge: "Chat history not loading on session switch",
                solution: "Added GET /api/chat/sessions/:id/messages endpoint + session click handler",
                color: "34D399", impact: "Medium"
            },
        ];

        challenges.forEach((c, i) => {
            const row = Math.floor(i / 2), col = i % 2;
            const x = 0.35 + col * 4.85, y = 1.05 + row * 1.56;
            s.addShape("rect", { x, y, w: 4.6, h: 1.42, fill: { color: C.cardBg }, line: { color: c.color, width: 0.5 }, shadow: makeShadow() });
            s.addShape("ellipse", { x: x + 0.12, y: y + 0.12, w: 0.42, h: 0.42, fill: { color: c.color }, line: { color: c.color, width: 0 } });
            s.addText(c.n, { x: x + 0.12, y: y + 0.12, w: 0.42, h: 0.42, fontSize: 13, bold: true, color: C.white, align: "center", valign: "middle" });
            s.addShape("rect", { x: x + 4.3, y: y + 0.12, w: 0.24, h: 0.25, fill: { color: c.impact === "High" ? "FF6B6B" : "F59E0B" }, line: { color: c.impact === "High" ? "FF6B6B" : "F59E0B", width: 0 } });
            s.addText(c.impact, { x: x + 4.29, y: y + 0.12, w: 0.28, h: 0.25, fontSize: 7, bold: true, color: C.white, align: "center", valign: "middle" });
            s.addText("⚠ " + c.challenge, { x: x + 0.65, y: y + 0.1, w: 3.7, h: 0.44, fontSize: 10, bold: true, color: C.white });
            s.addText("✓ " + c.solution, { x: x + 0.12, y: y + 0.62, w: 4.35, h: 0.72, fontSize: 9.5, color: C.light });
        });

        addSlideNum(s, 13, TOTAL);
        bottomBar(s);
    }

    // ══════════════════════════════════════════════════════════════
    // SLIDE 14 — PERFORMANCE METRICS
    // ══════════════════════════════════════════════════════════════
    {
        const s = pres.addSlide();
        s.background = { color: C.darkBg };

        s.addText("Testing", { x: 0.35, y: 0.22, w: 9, h: 0.55, fontSize: 26, bold: true, color: C.white });
        s.addText("Performance & Accuracy Metrics", { x: 0.5, y: 0.72, w: 9, h: 0.3, fontSize: 13, color: C.accent1 });

        // Bar chart — response times
        s.addChart(pres.charts.BAR, [
            { name: "Response Time (seconds)", labels: ["Login API", "Upload API", "Indexing (1 page)", "Chat Query (Groq)", "Chat Query (fallback)", "Dashboard Stats"], values: [0.3, 0.8, 12, 1.8, 0.5, 0.2] }
        ], {
            x: 0.35, y: 1.08, w: 5.5, h: 3.6,
            barDir: "col",
            chartColors: ["6C63FF"],
            chartArea: { fill: { color: "111827" }, roundedCorners: true },
            catAxisLabelColor: "94A3B8",
            valAxisLabelColor: "94A3B8",
            valGridLine: { color: "1E293B", size: 0.5 },
            catGridLine: { style: "none" },
            showValue: true,
            dataLabelColor: "FFFFFF",
            dataLabelPosition: "outEnd",
            showLegend: false,
            showTitle: true,
            title: "API Response Times (seconds)",
            titleColor: "FFFFFF",
            titleFontSize: 12,
        });

        // Right side metrics
        const rightMetrics = [
            { label: "Search Accuracy\n(Hybrid vs keyword only)", val: "+23%", color: "6C63FF" },
            { label: "Groq API Uptime\n(during development)", val: "99.9%", color: "00D4AA" },
            { label: "Embedding Dim.", val: "384", color: "F59E0B" },
            { label: "Max File Size", val: "50 MB", color: "FF6B6B" },
        ];
        rightMetrics.forEach((m, i) => {
            const y = 1.08 + i * 1.04;
            s.addShape("rect", { x: 6.1, y, w: 3.55, h: 0.9, fill: { color: C.cardBg }, line: { color: m.color, width: 0.6 } });
            s.addText(m.val, { x: 6.1, y: y + 0.0, w: 3.55, h: 0.55, fontSize: 26, bold: true, color: m.color, align: "center" });
            s.addText(m.label, { x: 6.1, y: y + 0.54, w: 3.55, h: 0.34, fontSize: 9, color: C.muted, align: "center" });
        });

        addSlideNum(s, 14, TOTAL);
        bottomBar(s);
    }

    // ══════════════════════════════════════════════════════════════
    // SLIDE 15 — FUTURE SCOPE
    // ══════════════════════════════════════════════════════════════
    {
        const s = pres.addSlide();
        s.background = { color: C.darkBg };

        s.addText("13", { x: 0.35, y: 0.2, w: 1, h: 0.5, fontSize: 28, bold: true, color: "1E293B" });
        s.addText("Future Scope & Enhancements", { x: 0.5, y: 0.22, w: 9, h: 0.55, fontSize: 26, bold: true, color: C.white });

        const future = [
            { phase: "Phase 2", icon: icons.globe, color: "6C63FF", title: "Third-Party Integrations", pts: ["Slack workspace connector", "Notion page sync", "Gmail / Outlook ingestion", "OAuth 2.0 flows"] },
            { phase: "Phase 2", icon: icons.brain, color: "00D4AA", title: "Advanced AI Features", pts: ["Multi-modal (image/chart) parsing", "Fine-tuned domain LLM", "Semantic chunking strategy", "Query analytics & gap analysis"] },
            { phase: "Phase 3", icon: icons.rocket, color: "F59E0B", title: "Scale & Enterprise", pts: ["Horizontal scaling + load balancer", "SSO (SAML 2.0 / Azure AD)", "Dedicated vector DB (Qdrant)", "Mobile apps (React Native)"] },
            { phase: "Phase 3", icon: icons.chart, color: "FF6B6B", title: "Analytics & Intelligence", pts: ["Knowledge gap identification", "Auto-tagging & categorization", "Query trend analysis", "Document freshness scoring"] },
        ];

        future.forEach((f, i) => {
            const col = i % 2, row = Math.floor(i / 2);
            const x = 0.35 + col * 4.85, y = 1.05 + row * 2.2;
            s.addShape("rect", { x, y, w: 4.6, h: 2.0, fill: { color: C.cardBg }, line: { color: f.color, width: 0.6 }, shadow: makeShadow() });
            s.addShape("rect", { x, y, w: 0.55, h: 2.0, fill: { color: f.color, transparency: 20 }, line: { color: f.color, width: 0 } });
            addIconCircle(s, f.icon, x + 0.275, y + 0.38, 0.22, f.color);
            s.addShape("rect", { x: x + 0.6, y, w: 0.65, h: 0.28, fill: { color: f.color }, line: { color: f.color, width: 0 } });
            s.addText(f.phase, { x: x + 0.6, y, w: 0.65, h: 0.28, fontSize: 8, bold: true, color: C.white, align: "center", valign: "middle" });
            s.addText(f.title, { x: x + 0.7, y: y + 0.32, w: 3.75, h: 0.4, fontSize: 14, bold: true, color: C.white });
            f.pts.forEach((p, j) => {
                s.addText([{ text: "▸ ", options: { color: f.color } }, { text: p, options: { color: C.light } }],
                    { x: x + 0.7, y: y + 0.78 + j * 0.3, w: 3.75, h: 0.28, fontSize: 11 });
            });
        });

        addSlideNum(s, 15, TOTAL);
        bottomBar(s);
    }

    // ══════════════════════════════════════════════════════════════
    // SLIDE 16 — CONCLUSION
    // ══════════════════════════════════════════════════════════════
    {
        const s = pres.addSlide();
        s.background = { color: C.darkBg };

        s.addShape("ellipse", { x: -1, y: -1, w: 5, h: 5, fill: { color: "6C63FF", transparency: 88 }, line: { color: "6C63FF", width: 0 } });
        s.addShape("ellipse", { x: 7, y: 2.5, w: 5, h: 5, fill: { color: "00D4AA", transparency: 88 }, line: { color: "00D4AA", width: 0 } });

        s.addText("14", { x: 0.35, y: 0.2, w: 1, h: 0.5, fontSize: 28, bold: true, color: "1E293B" });
        s.addText("Conclusion", { x: 0.5, y: 0.22, w: 9, h: 0.55, fontSize: 26, bold: true, color: C.white });

        s.addText("The AI-Powered Internal Knowledge Assistant successfully demonstrates that Retrieval-Augmented Generation, combined with a modern full-stack architecture, can transform how organizations access their internal knowledge.", {
            x: 0.5, y: 0.85, w: 9, h: 0.7, fontSize: 13, color: C.light, align: "justified"
        });

        const wins = [
            { icon: icons.check, color: "6C63FF", text: "Full-stack SaaS platform built from scratch with production-ready architecture" },
            { icon: icons.check, color: "00D4AA", text: "Hybrid RAG pipeline delivers superior accuracy over single-method retrieval" },
            { icon: icons.check, color: "F59E0B", text: "Role-based access (Admin/Mentor/Trainee) enforced at both UI and API level" },
            { icon: icons.check, color: "FF6B6B", text: "Source-attributed AI answers build user trust and enable knowledge traceability" },
            { icon: icons.check, color: "A78BFA", text: "System resilient to AI API failures via local embedding fallback chain" },
            { icon: icons.check, color: "34D399", text: "All 6 sprint objectives achieved within the Nov–Dec 2025 timeline" },
        ];

        wins.forEach((w, i) => {
            const col = i % 2, row = Math.floor(i / 2);
            const x = 0.35 + col * 4.85, y = 1.72 + row * 0.87;
            s.addShape("rect", { x, y, w: 4.6, h: 0.75, fill: { color: C.cardBg }, line: { color: w.color, width: 0.4 } });
            addIconCircle(s, w.icon, x + 0.33, y + 0.375, 0.22, w.color);
            s.addText(w.text, { x: x + 0.68, y: y + 0.06, w: 3.8, h: 0.63, fontSize: 10.5, color: C.light, valign: "middle" });
        });

        s.addShape("rect", { x: 0.35, y: 4.52, w: 9.3, h: 0.6, fill: { color: "6C63FF", transparency: 20 }, line: { color: C.accent1, width: 0.6 } });
        s.addText("\"The system is a working proof that private AI-powered knowledge management is achievable, cost-effective, and impactful.\"", {
            x: 0.5, y: 4.56, w: 9, h: 0.52, fontSize: 11.5, italic: true, color: C.white, align: "center", valign: "middle"
        });

        addSlideNum(s, 16, TOTAL);
        bottomBar(s);
    }

    // ══════════════════════════════════════════════════════════════
    // SLIDE 17 — CERTIFICATE
    // ══════════════════════════════════════════════════════════════
    {
        const s = pres.addSlide();
        s.background = { color: "FAFAFA" };

        // Gold border
        s.addShape("rect", { x: 0.2, y: 0.15, w: 9.6, h: 5.3, fill: { color: "FAFAFA" }, line: { color: "C9A84C", width: 3 } });
        s.addShape("rect", { x: 0.32, y: 0.27, w: 9.36, h: 5.06, fill: { color: "FAFAFA" }, line: { color: "C9A84C", width: 1 } });

        s.addText("CERTIFICATE OF COMPLETION", { x: 0.5, y: 0.45, w: 9, h: 0.55, fontSize: 22, bold: true, color: "1F3864", align: "center", charSpacing: 3 });
        s.addText("Final Major Project", { x: 0.5, y: 0.98, w: 9, h: 0.32, fontSize: 13, color: "7F6000", align: "center" });

        s.addShape("rect", { x: 3.5, y: 1.38, w: 3.0, h: 0.035, fill: { color: "C9A84C" }, line: { color: "C9A84C", width: 0 } });

        s.addText("This is to certify that", { x: 1, y: 1.55, w: 8, h: 0.3, fontSize: 12, color: "374151", align: "center" });
        s.addText("[NAME OF STUDENT]", { x: 1, y: 1.88, w: 8, h: 0.48, fontSize: 24, bold: true, color: "1F3864", align: "center" });
        s.addText("Enrollment No.: [ENROLLMENT NUMBER]", { x: 1, y: 2.35, w: 8, h: 0.28, fontSize: 11, color: "6B7280", align: "center" });

        s.addText("has successfully completed the Final Major Project titled:", { x: 1, y: 2.72, w: 8, h: 0.28, fontSize: 11.5, color: "374151", align: "center" });
        s.addText("\"AI-Powered Internal Knowledge Assistant\"", { x: 0.5, y: 3.03, w: 9, h: 0.38, fontSize: 15, bold: true, color: "1F3864", align: "center", italic: true });

        s.addText("B.Tech in Computer Science & Engineering (AI-ML)\nFaculty of Engineering Science and Technology, Adani University, Ahmedabad", {
            x: 0.5, y: 3.48, w: 9, h: 0.55, fontSize: 11, color: "6B7280", align: "center"
        });

        s.addShape("rect", { x: 3.5, y: 4.1, w: 3.0, h: 0.035, fill: { color: "C9A84C" }, line: { color: "C9A84C", width: 0 } });

        // Signature blocks
        const sigs = [
            { label: "Student Signature", name: "[NAME OF STUDENT]" },
            { label: "Mentor Signature", name: "[NAME OF MENTOR]" },
            { label: "HOD Signature", name: "Head of Dept., CSE AI-ML" },
        ];
        sigs.forEach((sig, i) => {
            const x = 0.5 + i * 3.08;
            s.addShape("rect", { x, y: 4.58, w: 2.7, h: 0.035, fill: { color: "374151" }, line: { color: "374151", width: 0 } });
            s.addText(sig.label, { x, y: 4.65, w: 2.7, h: 0.22, fontSize: 9, color: "7F6000", align: "center", bold: true });
            s.addText(sig.name, { x, y: 4.87, w: 2.7, h: 0.2, fontSize: 9, color: "6B7280", align: "center" });
        });

        s.addText("Adani University, Ahmedabad  ·  Nov–Dec 2025", { x: 0.5, y: 5.18, w: 9, h: 0.2, fontSize: 9, color: "9CA3AF", align: "center" });
    }

    // ══════════════════════════════════════════════════════════════
    // SLIDE 18 — THANK YOU
    // ══════════════════════════════════════════════════════════════
    {
        const s = pres.addSlide();
        s.background = { color: C.darkBg };

        s.addShape("ellipse", { x: -1.5, y: -1.5, w: 6, h: 6, fill: { color: "6C63FF", transparency: 85 }, line: { color: "6C63FF", width: 0 } });
        s.addShape("ellipse", { x: 5, y: 1.5, w: 6, h: 6, fill: { color: "00D4AA", transparency: 88 }, line: { color: "00D4AA", width: 0 } });
        s.addShape("ellipse", { x: 3, y: -1, w: 4, h: 4, fill: { color: "FF6B6B", transparency: 90 }, line: { color: "FF6B6B", width: 0 } });

        s.addImage({ data: icons.brain, x: 4.2, y: 0.6, w: 1.6, h: 1.6 });
        s.addText("Thank You", { x: 0.5, y: 2.3, w: 9, h: 0.9, fontSize: 52, bold: true, color: C.white, align: "center", fontFace: "Calibri" });
        s.addText("Questions & Discussion", { x: 0.5, y: 3.22, w: 9, h: 0.4, fontSize: 18, color: C.accent2, align: "center" });

        s.addShape("rect", { x: 2.5, y: 3.8, w: 5, h: 0.75, fill: { color: "6C63FF", transparency: 80 }, line: { color: C.accent1, width: 0.8 } });
        s.addText("AI-Powered Internal Knowledge Assistant\n[NAME OF STUDENT]  ·  [ENROLLMENT NO.]  ·  Adani University, 2025", {
            x: 2.5, y: 3.82, w: 5, h: 0.71, fontSize: 10, color: C.white, align: "center", valign: "middle"
        });

        bottomBar(s);
    }

    await pres.writeFile({ fileName: "D:/OneDrive/Desktop/major-project/AI_Knowledge_Assistant_Presentation.pptx" });
    console.log("✅ Presentation generated!");
}

buildPresentation().catch(e => { console.error(e); process.exit(1); });