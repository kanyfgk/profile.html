/* Welcome onboarding v2 */

const WelcomeApp = {

    storageKey: "vaero:welcome:completed:v2",

    hasCompleted(){

        return localStorage.getItem(
            this.storageKey
        ) === "true";

    },

    complete(saveCompletion = true){

        if(saveCompletion){
    localStorage.setItem(
        this.storageKey,
        "true"
    );
}

        const screen =
            document.getElementById(
                "vaero-welcome-screen"
            );

        if(!screen){
            return;
        }

        screen.classList.add(
            "is-entering"
        ); 

        window.setTimeout(() => {

            screen.classList.add(
                "is-closing"
            );

        }, 900);

        window.setTimeout(() => {

            screen.remove();

        }, 1400);

    },

    render(){

        if(
            this.hasCompleted() ||
            document.getElementById(
                "vaero-welcome-screen"
            )
        ){
            return;
        }

        const screen =
            document.createElement("div");

        screen.id =
            "vaero-welcome-screen";

        screen.className =
            "vaero-welcome-screen";

        screen.innerHTML = `
            <div class="welcome-stars"></div>

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
                    >
                </picture>
            </div>

            <main class="welcome-layout">

                <section class="welcome-left">

                    <div class="welcome-brand">
                        <strong>VAERO</strong>
                        <span>ENGINE</span>
                    </div>

                    <div class="welcome-intro">

                        <h1>
    Varlıkların
    <br>
    Zekası.
    <span>Seninle Evrilecek.</span>
</h1>

                        <p class="welcome-description">
                            VAERO Engine, varlıklarının yaşamını yönetir,
                            deneyimlerinden öğrenir ve seninle birlikte
                            sürekli gelişir.
                        </p>

                        <div class="welcome-features">

                            <article class="welcome-feature">
                                <span class="welcome-feature-icon" aria-hidden="true">
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
                                    <strong>Akıllı Organlar</strong>
                                    <p>
                                        Her varlığın kendi organlarına sahiptir.
                                    </p>
                                </div>
                            </article>

                            <article class="welcome-feature">
                                <span class="welcome-feature-icon" aria-hidden="true">
    <svg viewBox="0 0 48 48">
        <ellipse cx="24" cy="24" rx="18" ry="9" transform="rotate(-28 24 24)"></ellipse>
        <ellipse cx="24" cy="24" rx="9" ry="18" transform="rotate(-28 24 24)"></ellipse>
        <circle cx="24" cy="24" r="3"></circle>
        <circle class="welcome-orbit-node" cx="38" cy="15" r="2.5"></circle>
        <circle class="welcome-orbit-node" cx="11" cy="31" r="2"></circle>
    </svg>
</span>

                                <div>
                                    <strong>Sürekli Evrim</strong>
                                    <p>
                                        Deneyimlerinden öğrenir, güçlenir, evrilir.
                                    </p>
                                </div>
                            </article>

                            <article class="welcome-feature">
                                <span class="welcome-feature-icon" aria-hidden="true">
    <svg viewBox="0 0 48 48">
        <path d="M24 4 40 10v12c0 10-6.5 17.5-16 22C14.5 39.5 8 32 8 22V10L24 4Z"></path>
        <path d="m16.5 24 5 5 10-11"></path>
    </svg>
</span>
                                <div>
                                    <strong>Senin Kontrolünde</strong>
                                    <p>
                                        Tüm varlıkların güvende ve senin yönetiminde.
                                    </p>
                                </div>
                            </article>

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
>
    ☀️
</button>

<button
    type="button"
    data-welcome-theme="dark"
    aria-label="Karanlık tema"
>
    ☾
</button>
                    </div>

                    <div class="welcome-auth-panel">

                        <div class="welcome-auth-logo" aria-hidden="true">
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
                            <h2>VAERO Engine’e Hoş Geldin</h2>

                            <span>
                                Varlıklarını yönet, evrimleştir
                                ve geleceği birlikte inşa et.
                            </span>
                        </div>

                        <form class="welcome-auth-form">

                            <label>
                                <span>E-posta</span>

                                <div class="welcome-input-wrap">
                                    <span aria-hidden="true">
    <svg viewBox="0 0 24 24" width="16" height="16">
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
                                    >
                                </div>
                            </label>

                            <label>
                                <span>Şifre</span>

                                <div class="welcome-input-wrap">
                                    <span aria-hidden="true">
    <svg viewBox="0 0 24 24" width="16" height="16">
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
                            >
                                Şifremi Unuttum?
                            </button>

                            <button
                                type="button"
                                class="welcome-primary"
                                data-welcome-action="login"
                            >
                                Giriş Yap
                            </button>

                        </form>

                        <div class="welcome-divider">
                            <span></span>
                            <small>veya</small>
                            <span></span>
                        </div>

                        <button
                            type="button"
                            class="welcome-secondary"
                            data-welcome-action="start"
                        >
                            Hesap Oluştur
                        </button>

                        <a class="welcome-learn-more" href="#">
                            VAERO Engine hakkında daha fazla bilgi edin
                            <span>→</span>
                        </a>

                    </div>

                </section>

            </main>
        `;
        
        const passwordInput =
    screen.querySelector(
        'input[name="password"]'
    );

const passwordToggle =
    screen.querySelector(
        ".welcome-password-toggle"
    );

if(passwordInput && passwordToggle){

    passwordToggle.addEventListener(
        "click",
        () => {

            const isHidden =
                passwordInput.type ===
                "password";

            passwordInput.type =
                isHidden
                    ? "text"
                    : "password";

            passwordToggle.setAttribute(
                "aria-label",
                isHidden
                    ? "Şifreyi gizle"
                    : "Şifreyi göster"
            );

        }
    );

}

        const themeButtons =
    screen.querySelectorAll(
        "[data-welcome-theme]"
    );

themeButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const selectedTheme =
                button.dataset.welcomeTheme;

            screen.classList.toggle(
                "is-light-theme",
                selectedTheme === "light"
            );

            themeButtons.forEach(
                themeButton => {

                    const isActive =
                        themeButton === button;

                    themeButton.classList.toggle(
                        "is-active",
                        isActive
                    );

                    themeButton.setAttribute(
                        "aria-pressed",
                        String(isActive)
                    );

                }
            );

        }
    );

});
        
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

                if(
                    screen.classList.contains(
                        "is-entering"
                    )
                ){
                    return;
                }

                const action =
                    button.dataset.welcomeAction;

                if(action === "login"){

                    this.complete();
                    return;

                }

                if(action === "start"){

                    screen.classList.add(
                        "is-entering"
                    );

                    window.setTimeout(() => {

                        screen.classList.add(
                            "is-closing"
                        );

                    }, 700);

                    window.setTimeout(() => {

                        screen.remove();

                        if(
                            window.DiscoveryApp &&
                            typeof window.DiscoveryApp.render ===
                                "function"
                        ){
                            window.DiscoveryApp.render();
                        }

                    }, 1200);

                }

            }
        );

    },
    
    reset(){

        localStorage.removeItem(
            this.storageKey
        );

        window.location.reload();

    },

    init(){

        if(
            document.readyState === "loading"
        ){

            document.addEventListener(
                "DOMContentLoaded",
                () => this.render(),
                {
                    once: true
                }
            );

            return;
        }

        this.render();

    }

};

window.WelcomeApp = WelcomeApp;

WelcomeApp.init();
