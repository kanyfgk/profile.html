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

        xl: 38,

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

        xxl: 40,

        xxxl: 56

    },


    /* =====================================================
       ICON
    ===================================================== */

    icon: {

        tiny: 18,

        small: 22,

        normal: 34,

        large: 46,

        hero: 56,

        display: 72

    },


    /* =====================================================
       ANIMATION
    ===================================================== */

    animation: {

        instant: 80,

        fast: 120,

        normal: 220,

        slow: 320,

        deliberate: 460,

        ambient: 800

    },


    /* =====================================================
       COLORS
    ===================================================== */

    colors: {

        background:
            "var(--bg)",

        backgroundElevated:
            "var(--bg-elevated, var(--bg))",

        surface:
            "var(--surface)",

        surfaceSoft:
            "rgba(255,255,255,.035)",

        surfaceStrong:
            "rgba(255,255,255,.055)",

        card:
            "rgba(255,255,255,.045)",

        cardStrong:
            "rgba(255,255,255,.065)",

        cardElevated:
            "rgba(255,255,255,.08)",

        border:
            "var(--border-soft)",

        borderStrong:
            "var(--border-strong)",

        text:
            "var(--text)",

        textStrong:
            "var(--text-strong, var(--text))",

        muted:
            "var(--muted)",

        mutedSoft:
            "var(--muted-soft, var(--muted))",

        accent:
            "var(--gold-soft)",

        accentStrong:
            "var(--gold, var(--gold-soft))",

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

        whisper:
            0.025,

        subtle:
            0.045,

        soft:
            0.065,

        medium:
            0.12,

        strong:
            0.2,

        emphasis:
            0.32

    },


    /* =====================================================
       ELEVATION
    ===================================================== */

    elevation: {

        none:
            "none",

        low:
            "0 10px 30px rgba(0,0,0,.12)",

        medium:
            "0 18px 50px rgba(0,0,0,.18)",

        high:
            "0 28px 80px rgba(0,0,0,.24)",

        floating:
            "0 32px 100px rgba(0,0,0,.3)"

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
            "cubic-bezier(.16,1,.3,1)",

        easeInOut:
            "cubic-bezier(.65,0,.35,1)"

    },


    /* =====================================================
       Z INDEX
    ===================================================== */

    zIndex: {

        base:
            1,

        raised:
            10,

        navigation:
            100,

        overlay:
            500,

        panel:
            700,

        modal:
            900,

        critical:
            1200

    },


    /* =====================================================
       BREAKPOINTS

       Reference only.
       CSS remains authority for responsive layout.
    ===================================================== */

    breakpoint: {

        compact:
            480,

        mobile:
            720,

        tablet:
            1024,

        desktop:
            1280

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


    cardSoft: `
        border-radius:var(--radius-md);
        padding:18px;
        background:rgba(255,255,255,.035);
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

    hasGroup(group){

        return Boolean(
            group &&
            typeof this[group] ===
                "object" &&
            this[group] !==
                null
        );

    },


    get(
        group,
        name,
        fallback = null
    ){

        if(
            !this.hasGroup(
                group
            )
        ){

            return fallback;

        }


        const value =
            this[group][
                name
            ];


        return value ??
            fallback;

    },


    getSpacing(name){

        return this.get(
            "spacing",
            name,
            this.spacing.md
        );

    },


    getRadius(name){

        return this.get(
            "radius",
            name,
            this.radius.medium
        );

    },


    getAnimation(name){

        return this.get(
            "animation",
            name,
            this.animation.normal
        );

    },


    getColor(name){

        return this.get(
            "colors",
            name,
            this.colors.text
        );

    },


    getElevation(name){

        return this.get(
            "elevation",
            name,
            this.elevation.low
        );

    },


    getMotion(name){

        return this.get(
            "motion",
            name,
            this.motion.ease
        );

    },


    getZIndex(name){

        return this.get(
            "zIndex",
            name,
            this.zIndex.base
        );

    },


    getBreakpoint(name){

        return this.get(
            "breakpoint",
            name,
            this.breakpoint.mobile
        );

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        return {

            radius:
                {
                    ...this.radius
                },

            spacing:
                {
                    ...this.spacing
                },

            icon:
                {
                    ...this.icon
                },

            animation:
                {
                    ...this.animation
                },

            colors:
                {
                    ...this.colors
                },

            opacity:
                {
                    ...this.opacity
                },

            elevation:
                {
                    ...this.elevation
                },

            motion:
                {
                    ...this.motion
                },

            zIndex:
                {
                    ...this.zIndex
                },

            breakpoint:
                {
                    ...this.breakpoint
                }

        };

    }

};


/* =========================================================
   REGISTER
========================================================= */

try{

    if(
        typeof VAERO !==
            "undefined" &&
        typeof VAERO.register ===
            "function"
    ){

        VAERO.register(
            "theme",
            Theme
        );

    }

} catch(error){

    console.warn(
        "Theme VAERO register başarısız:",
        error
    );

}


if(
    typeof window !==
    "undefined"
){

    window.Theme =
        Theme;

}
