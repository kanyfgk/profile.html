/* =========================================================
   VAERO THEME
   Shared Design Tokens / Legacy Compatibility
========================================================= */

const Theme = {

    /* =====================================================
       RADIUS
    ===================================================== */

    radius: {

        xs: 10,

        small: 16,

        medium: 22,

        large: 30,

        pill: 999

    },


    /* =====================================================
       SPACING
    ===================================================== */

    spacing: {

        xxs: 4,

        xs: 6,

        sm: 10,

        md: 18,

        lg: 24,

        xl: 32,

        xxl: 40

    },


    /* =====================================================
       ICON
    ===================================================== */

    icon: {

        tiny: 18,

        small: 22,

        normal: 34,

        large: 46,

        hero: 56

    },


    /* =====================================================
       ANIMATION
    ===================================================== */

    animation: {

        instant: 80,

        fast: 120,

        normal: 220,

        slow: 320,

        deliberate: 460

    },


    /* =====================================================
       COLORS
    ===================================================== */

    colors: {

        background:
            "var(--bg)",

        surface:
            "var(--surface)",

        surfaceSoft:
            "rgba(255,255,255,.035)",

        card:
            "rgba(255,255,255,.045)",

        cardStrong:
            "rgba(255,255,255,.065)",

        border:
            "var(--border-soft)",

        borderStrong:
            "var(--border-strong)",

        text:
            "var(--text)",

        muted:
            "var(--muted)",

        accent:
            "var(--gold-soft)",

        success:
            "var(--green)",

        warning:
            "var(--warning, #d6a84c)",

        danger:
            "var(--danger, #d35f5f)",

        info:
            "var(--info, #7ca7d8)"

    },


    /* =====================================================
       OPACITY
    ===================================================== */

    opacity: {

        subtle:
            0.045,

        soft:
            0.065,

        medium:
            0.12,

        strong:
            0.2

    },


    /* =====================================================
       ELEVATION
    ===================================================== */

    elevation: {

        low:
            "0 10px 30px rgba(0,0,0,.12)",

        medium:
            "0 18px 50px rgba(0,0,0,.18)",

        high:
            "0 28px 80px rgba(0,0,0,.24)"

    },


    /* =====================================================
       MOTION
    ===================================================== */

    motion: {

        ease:
            "cubic-bezier(.22,.8,.24,1)",

        easeSoft:
            "cubic-bezier(.2,.7,.2,1)",

        easeOut:
            "cubic-bezier(.16,1,.3,1)"

    },


    /* =====================================================
       LEGACY INLINE COMPATIBILITY

       Mevcut eski uygulamalar kırılmasın diye tutuluyor.
       Yeni ekranlarda sınıf tabanlı CSS tercih edilecek.
    ===================================================== */

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
    `,


    /* =====================================================
       HELPERS
    ===================================================== */

    getSpacing(name){

        return (
            this.spacing[
                name
            ] ??
            this.spacing.md
        );

    },


    getRadius(name){

        return (
            this.radius[
                name
            ] ??
            this.radius.medium
        );

    },


    getAnimation(name){

        return (
            this.animation[
                name
            ] ??
            this.animation.normal
        );

    },


    getColor(name){

        return (
            this.colors[
                name
            ] ??
            this.colors.text
        );

    }

};


window.Theme =
    Theme;
