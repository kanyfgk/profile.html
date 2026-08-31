/* =========================================================
   VAERO WELCOME APP
   Welcome Onboarding / Entry Surface

   UI + onboarding entry authority.

   IMPORTANT:
   - This file does NOT implement authentication.
   - Discovery owns onboarding completion.
   - Engine starts only through the existing bootstrap flow.
========================================================= */

const WelcomeApp = {

    storageKey:
        "vaero:welcome:completed:v2",

    screenId:
        "vaero-welcome-screen",

    transitionDuration:
        1400,


    /* =====================================================
       STORAGE
    ===================================================== */

    hasCompleted(){

        try{

            return (
                localStorage.getItem(
                    this.storageKey
                ) ===
                "true"
            );

        } catch(error){

            return false;

        }

    },


    setCompleted(value = true){

        try{

            if(value){

                localStorage.setItem(
                    this.storageKey,
                    "true"
                );

            }

            else {

                localStorage.removeItem(
                    this.storageKey
                );

            }


            return true;

        } catch(error){

            console.warn(
                "Welcome completion durumu kaydedilemedi:",
                error
            );


            return false;

        }

    },


    /* =====================================================
       ELEMENTS
    ===================================================== */

    getScreen(){

        return document.getElementById(
            this.screenId
        );

    },


    getEngineRoot(){

        return document.getElementById(
            "engine"
        );

    },


    getDiscovery(){

        return (
            window.DiscoveryApp ||
            null
        );

    },


    /* =====================================================
       TRANSITION
    ===================================================== */

    closeScreen({
        saveCompletion = false,
        afterClose = null
    } = {}){

        const screen =
            this.getScreen();


        if(!screen){

            if(
                typeof afterClose ===
                    "function"
            ){

                afterClose();

            }


            return false;

        }


        if(
            screen.classList.contains(
                "is-entering"
            )
        ){

            return false;

        }


        if(saveCompletion){

            this.setCompleted(
                true
            );

        }


        screen.classList.add(
            "is-entering"
        );


        window.setTimeout(
            () => {

                screen.classList.add(
                    "is-closing"
                );

            },
            900
        );


        window.setTimeout(
            () => {

                screen.remove();


                if(
                    typeof afterClose ===
                        "function"
                ){

                    afterClose();

                }

            },
            this.transitionDuration
        );


        return true;

    },


    complete(
        saveCompletion = true
    ){

        return this.closeScreen({
            saveCompletion
        });

    },


    /* =====================================================
       DISCOVERY ENTRY
    ===================================================== */

    openDiscovery(){

        const engine =
            this.getEngineRoot();


        const discovery =
            this.getDiscovery();


        if(
            !engine ||
            !discovery ||
            typeof discovery.render !==
                "function"
        ){

            console.error(
                "Discovery başlatılamadı."
            );


            return false;

        }


        try{

            discovery.render(
                engine
            );


            return true;

        } catch(error){

            console.error(
                "Discovery açılamadı:",
                error
            );


            return false;

        }

    },


    startJourney(){

        const screen =
            this.getScreen();


        if(
            !screen ||
            screen.classList.contains(
                "is-entering"
            )
        ){

            return false;

        }


        /*
         * Welcome completion burada yazılmaz.
         * Discovery tamamlandığında DiscoveryApp
         * mevcut bootstrap contract gereği bu anahtarı yazar.
         */

        screen.classList.add(
            "is-entering"
        );


        window.setTimeout(
            () => {

                screen.classList.add(
                    "is-closing"
                );

            },
            900
        );


        window.setTimeout(
            () => {

                const opened =
                    this.openDiscovery();


                if(!opened){

                    screen.classList.remove(
                        "is-entering",
                        "is-closing"
                    );


                    return;

                }


                screen.remove();

            },
            this.transitionDuration
        );


        return true;

    },


    /* =====================================================
       AUTH PLACEHOLDER
       -----------------------------------------------------
       No fake authentication.
       A real auth service must be connected before this
       button can authenticate a user.
    ===================================================== */

    showAuthUnavailable(){

        const screen =
            this.getScreen();


        if(!screen){

            return false;

        }


        const existing =
            screen.querySelector(
                ".welcome-auth-status"
            );


        if(existing){

            existing.textContent =
                "Giriş sistemi henüz Engine kimlik doğrulama servisine bağlanmadı.";


            return true;

        }


        const form =
            screen.querySelector(
                ".welcome-auth-form"
            );


        if(!form){

            return false;

        }


        const message =
            document.createElement(
                "p"
            );


        message.className =
            "welcome-auth-status";


        message.setAttribute(
            "role",
            "status"
        );


        message.textContent =
            "Giriş sistemi henüz Engine kimlik doğrulama servisine bağlanmadı.";


        form.appendChild(
            message
        );


        return true;

    },


    /* =====================================================
       MOBILE AUTH
    ===================================================== */

    openMobileAuth(){

        const screen =
            this.getScreen();


        if(!screen){

            return false;

        }


        screen.classList.add(
            "is-mobile-auth-open"
        );


        const authPanel =
            screen.querySelector(
                ".welcome-auth-panel"
            );


        if(authPanel){

            window.setTimeout(
                () => {

                    try{

                        authPanel.scrollIntoView({
                            behavior:
                                "smooth",

                            block:
                                "start"
                        });

                    } catch(error){

                        authPanel.scrollIntoView();

                    }

                },
                80
            );

        }


        return true;

    },


    closeMobileAuth(){

        const screen =
            this.getScreen();


        if(!screen){

            return false;

        }


        screen.classList.remove(
            "is-mobile-auth-open"
        );


        try{

            window.scrollTo({
                top:
                    0,

                behavior:
                    "smooth"
            });

        } catch(error){

            window.scrollTo(
                0,
                0
            );

        }


        return true;

    },


    /* =====================================================
       PASSWORD
    ===================================================== */

    togglePassword(){

        const screen =
            this.getScreen();


        if(!screen){

            return false;

        }


        const input =
            screen.querySelector(
                'input[name="password"]'
            );


        const button =
            screen.querySelector(
                ".welcome-password-toggle"
            );


        if(
            !input ||
            !button
        ){

            return false;

        }


        const isHidden =
            input.type ===
                "password";


        input.type =
            isHidden
                ? "text"
                : "password";


        button.setAttribute(
            "aria-label",
            isHidden
                ? "Şifreyi gizle"
                : "Şifreyi göster"
        );


        button.setAttribute(
            "aria-pressed",
            String(
                isHidden
            )
        );


        return true;

    },


    /* =====================================================
       THEME
    ===================================================== */

    setTheme(theme){

        const screen =
            this.getScreen();


        if(!screen){

            return false;

        }


        const selectedTheme =
            theme ===
                "dark"
                ? "dark"
                : "light";


        screen.classList.toggle(
            "is-light-theme",
            selectedTheme ===
                "light"
        );


        screen.classList.toggle(
            "is-dark-theme",
            selectedTheme ===
                "dark"
        );


        screen
            .querySelectorAll(
                "[data-welcome-theme]"
            )
            .forEach(
                button => {

                    const active =
                        button.dataset
                            .welcomeTheme ===
                            selectedTheme;


                    button.classList.toggle(
                        "is-active",
                        active
                    );


                    button.setAttribute(
                        "aria-pressed",
                        String(
                            active
                        )
                    );

                }
            );


        return true;

    },


    /* =====================================================
       EVENT BINDING
    ===================================================== */

    bindEvents(screen){

        if(!screen){

            return false;

        }


        const mobileBackButton =
            screen.querySelector(
                ".welcome-mobile-back"
            );


        mobileBackButton?.addEventListener(
            "click",
            () => {

                this.closeMobileAuth();

            }
        );


        const passwordToggle =
            screen.querySelector(
                ".welcome-password-toggle"
            );


        passwordToggle?.addEventListener(
            "click",
            () => {

                this.togglePassword();

            }
        );


        screen
            .querySelectorAll(
                "[data-welcome-theme]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            this.setTheme(
                                button.dataset
                                    .welcomeTheme
                            );

                        }
                    );

                }
            );


        const form =
            screen.querySelector(
                ".welcome-auth-form"
            );


        form?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                this.showAuthUnavailable();

            }
        );


        const learnMore =
            screen.querySelector(
                ".welcome-learn-more"
            );


        learnMore?.addEventListener(
            "click",
            event => {

                event.preventDefault();

            }
        );


        screen.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-welcome-action]"
                    );


                if(!button){

                    return;

                }


                event.preventDefault();


                if(
                    screen.classList.contains(
                        "is-entering"
                    )
                ){

                    return;

                }


                const action =
                    button.dataset
                        .welcomeAction;


                switch(action){

                    case "show-login":

                        this.openMobileAuth();

                        break;


                    case "login":

                        this.showAuthUnavailable();

                        break;


                    case "start":

                        this.startJourney();

                        break;

                }

            }
        );


        return true;

    },


    /* =====================================================
       RENDER
    ===================================================== */

    render(){

        if(
            this.hasCompleted() ||
            this.getScreen()
        ){

            return false;

        }


        const screen =
            document.createElement(
                "div"
            );


        screen.id =
            this.screenId;


        screen.className =
    "vaero-welcome-screen is-dark-theme";

        screen.innerHTML = `
            <div
                class="welcome-stars"
                aria-hidden="true"
            ></div>


            <div
                class="welcome-scene"
                aria-hidden="true"
            >

                <picture>

                    <source
                        media="(max-width:768px)"
                        srcset="assets/welcome/vaero-earth-mobile.webp"
                    >


                    <img
                        src="assets/welcome/vaero-earth-desktop.webp.png"
                        alt=""
                        decoding="async"
                    >

                </picture>

            </div>


            <main class="welcome-layout">

                <section class="welcome-left">

                    <div class="welcome-brand">

                        <strong>
                            VAERO
                        </strong>

                        <span>
                            ENGINE
                        </span>

                    </div>


                    <div class="welcome-intro">

                        <h1>
                            Varlıkların
                            <br>
                            Zekası.
                            <span>
                                Seninle Evrilecek.
                            </span>
                        </h1>


                        <p class="welcome-description">
                            VAERO Engine, varlıklarının yaşamını yönetir,
                            deneyimlerinden öğrenir ve seninle birlikte
                            sürekli gelişir.
                        </p>


                        <div class="welcome-features">

                            <article class="welcome-feature">

                                <span
                                    class="welcome-feature-icon"
                                    aria-hidden="true"
                                >

                                    <svg viewBox="0 0 48 48">

                                        <path d="M20 8a7 7 0 0 0-7 7v1a7 7 0 0 0-3 12 7 7 0 0 0 7 8h3V8Z"></path>

                                        <path d="M28 8a7 7 0 0 1 7 7v1a7 7 0 0 1 3 12 7 7 0 0 1-7 8h-3V8Z"></path>

                                        <path d="M20 16c-4 0-6 2-6 5"></path>

                                        <path d="M28 16c4 0 6 2 6 5"></path>

                                        <path d="M20 27c-4 0-6 2-6 5"></path>

                                        <path d="M28 27c4 0 6 2 6 5"></path>

                                        <path d="M20 22h8"></path>

                                    </svg>

                                </span>


                                <div>

                                    <strong>
                                        Akıllı Organlar
                                    </strong>

                                    <p>
                                        Her varlık kendi organ katmanlarına sahiptir.
                                    </p>

                                </div>

                            </article>


                            <article class="welcome-feature">

                                <span
                                    class="welcome-feature-icon"
                                    aria-hidden="true"
                                >

                                    <svg viewBox="0 0 48 48">

                                        <ellipse
                                            cx="24"
                                            cy="24"
                                            rx="18"
                                            ry="9"
                                            transform="rotate(-28 24 24)"
                                        ></ellipse>

                                        <ellipse
                                            cx="24"
                                            cy="24"
                                            rx="9"
                                            ry="18"
                                            transform="rotate(-28 24 24)"
                                        ></ellipse>

                                        <circle
                                            cx="24"
                                            cy="24"
                                            r="3"
                                        ></circle>

                                        <circle
                                            class="welcome-orbit-node"
                                            cx="38"
                                            cy="15"
                                            r="2.5"
                                        ></circle>

                                        <circle
                                            class="welcome-orbit-node"
                                            cx="11"
                                            cy="31"
                                            r="2"
                                        ></circle>

                                    </svg>

                                </span>


                                <div>

                                    <strong>
                                        Sürekli Evrim
                                    </strong>

                                    <p>
                                        Deneyimleri ve gelişim kayıtlarını yaşayan yapının parçası haline getirir.
                                    </p>

                                </div>

                            </article>


                            <article class="welcome-feature">

                                <span
                                    class="welcome-feature-icon"
                                    aria-hidden="true"
                                >

                                    <svg viewBox="0 0 48 48">

                                        <path d="M24 4 40 10v12c0 10-6.5 17.5-16 22C14.5 39.5 8 32 8 22V10L24 4Z"></path>

                                        <path d="m16.5 24 5 5 10-11"></path>

                                    </svg>

                                </span>


                                <div>

                                    <strong>
                                        Senin Kontrolünde
                                    </strong>

                                    <p>
                                        Varlıkların, tercihlerin ve Engine içindeki sınırların senin kontrolündedir.
                                    </p>

                                </div>

                            </article>

                        </div>


                        <div class="welcome-mobile-actions">

                            <button
                                type="button"
                                class="welcome-mobile-primary"
                                data-welcome-action="start"
                            >
                                Başla
                            </button>


                            <div class="welcome-mobile-divider">

                                <span></span>

                                <small>
                                    veya
                                </small>

                                <span></span>

                            </div>


                            <button
                                type="button"
                                class="welcome-mobile-secondary"
                                data-welcome-action="show-login"
                            >
                                Hesabım Var
                            </button>


                            <p class="welcome-mobile-security">

                                <span aria-hidden="true">
                                    ◇
                                </span>

                                Özel. Kontrollü. VAERO Engine.

                            </p>

                        </div>

                    </div>


                    <p class="welcome-copyright">
                        © 2026 VAERO Engine. Tüm hakları saklıdır.
                    </p>

                </section>


                <section class="welcome-right">

                    <div class="welcome-theme-toggle">

                        <button
    type="button"
    data-welcome-theme="light"
    aria-label="Aydınlık tema"
    aria-pressed="false"
>
    ☀️
</button>

<button
    type="button"
    class="is-active"
    data-welcome-theme="dark"
    aria-label="Karanlık tema"
    aria-pressed="true"
>
    ☾
</button>

                    </div>


                    <div class="welcome-auth-panel">

                        <button
                            type="button"
                            class="welcome-mobile-back"
                            aria-label="Geri dön"
                        >
                            ←
                        </button>


                        <div
                            class="welcome-auth-logo"
                            aria-hidden="true"
                        >

                            <svg viewBox="0 0 82 72">

                                <path
                                    d="M9 10 37 57 47 41 29 10Z"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="6"
                                    stroke-linejoin="miter"
                                ></path>

                                <path
                                    d="M34 10 47 31 59 10H73L40 64"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="6"
                                    stroke-linejoin="miter"
                                ></path>

                            </svg>

                        </div>


                        <div class="welcome-auth-heading">

                            <h2>
                                VAERO Engine’e Hoş Geldin
                            </h2>

                            <span>
                                Varlıklarını yönet, evrimleştir
                                ve geleceği birlikte inşa et.
                            </span>

                        </div>


                        <form
                            class="welcome-auth-form"
                            novalidate
                        >

                            <label>

                                <span>
                                    E-posta
                                </span>


                                <div class="welcome-input-wrap">

                                    <span aria-hidden="true">

                                        <svg
                                            viewBox="0 0 24 24"
                                            width="16"
                                            height="16"
                                        >

                                            <rect
                                                x="3"
                                                y="5"
                                                width="18"
                                                height="14"
                                                rx="2"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="1.5"
                                            ></rect>

                                            <path
                                                d="m4 7 8 6 8-6"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="1.5"
                                            ></path>

                                        </svg>

                                    </span>


                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="ornek@email.com"
                                        autocomplete="email"
                                        inputmode="email"
                                    >

                                </div>

                            </label>


                            <label>

                                <span>
                                    Şifre
                                </span>


                                <div class="welcome-input-wrap">

                                    <span aria-hidden="true">

                                        <svg
                                            viewBox="0 0 24 24"
                                            width="16"
                                            height="16"
                                        >

                                            <rect
                                                x="5"
                                                y="10"
                                                width="14"
                                                height="11"
                                                rx="2"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="1.5"
                                            ></rect>

                                            <path
                                                d="M8 10V7a4 4 0 0 1 8 0v3"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="1.5"
                                            ></path>

                                        </svg>

                                    </span>


                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Şifrenizi girin"
                                        autocomplete="current-password"
                                    >


                                    <button
                                        type="button"
                                        class="welcome-password-toggle"
                                        aria-label="Şifreyi göster"
                                        aria-pressed="false"
                                    >

                                        <svg
                                            viewBox="0 0 24 24"
                                            width="17"
                                            height="17"
                                            aria-hidden="true"
                                        >

                                            <path
                                                d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="1.5"
                                            ></path>

                                            <circle
                                                cx="12"
                                                cy="12"
                                                r="2.5"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="1.5"
                                            ></circle>

                                        </svg>

                                    </button>

                                </div>

                            </label>


                            <button
                                type="button"
                                class="welcome-forgot-password"
                                data-welcome-action="login"
                            >
                                Şifremi Unuttum?
                            </button>


                            <button
                                type="submit"
                                class="welcome-primary"
                            >
                                Giriş Yap
                            </button>

                        </form>


                        <div class="welcome-divider">

                            <span></span>

                            <small>
                                veya
                            </small>

                            <span></span>

                        </div>


                        <button
                            type="button"
                            class="welcome-secondary"
                            data-welcome-action="start"
                        >
                            Hesap Oluştur
                        </button>


                        <a
                            class="welcome-learn-more"
                            href="#"
                            aria-disabled="true"
                        >
                            VAERO Engine hakkında daha fazla bilgi edin
                            <span>→</span>
                        </a>

                    </div>

                </section>

            </main>
        `;


        document.body.appendChild(
            screen
        );


        this.bindEvents(
            screen
        );


        this.setTheme(
    "dark"
);


        return true;

    },


    /* =====================================================
       RESET
    ===================================================== */

    reset(){

        this.setCompleted(
            false
        );


        window.location.reload();


        return true;

    },


    /* =====================================================
       INIT
    ===================================================== */

    init(){

        if(
            document.readyState ===
                "loading"
        ){

            document.addEventListener(
                "DOMContentLoaded",
                () => {

                    this.render();

                },
                {
                    once:
                        true
                }
            );


            return true;

        }


        this.render();


        return true;

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
            "welcomeApp",
            WelcomeApp
        );

    }

} catch(error){

    /* global remains available */

}


/* =========================================================
   GLOBAL
========================================================= */

window.WelcomeApp =
    WelcomeApp;


/* =========================================================
   START
========================================================= */

WelcomeApp.init();
