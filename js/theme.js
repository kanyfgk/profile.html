const Theme = {

    radius: {
        small: 16,
        medium: 22,
        large: 30
    },

    spacing: {
        xs: 6,
        sm: 10,
        md: 18,
        lg: 24,
        xl: 32
    },

    icon: {
        small: 22,
        normal: 34,
        large: 46
    },

    animation: {
        fast: 120,
        normal: 220,
        slow: 320
    },

    colors: {
        background: "var(--bg)",
        surface: "var(--surface)",
        card: "rgba(255,255,255,.045)",
        border: "var(--border-soft)",
        borderStrong: "var(--border-strong)",
        text: "var(--text)",
        muted: "var(--muted)",
        success: "var(--green)",
        accent: "var(--gold-soft)"
    },

    /*
     * Legacy uygulamalar için geçici uyumluluk.
     * Yeni ekranlarda inline stil yerine CSS sınıfları kullanılacak.
     */
    card: `
        border-radius:var(--radius-md);
        padding:20px;
        background:rgba(255,255,255,.045);
        border:1px solid var(--border-soft);
    `,

    appIcon: `
        width:56px;
        height:56px;
        flex:0 0 56px;
        border-radius:18px;
        background:rgba(255,255,255,.065);
        border:1px solid var(--border-soft);
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:28px;
    `

};

window.Theme = Theme;
