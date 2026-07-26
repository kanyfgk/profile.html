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
                            Varlıkların Zekası.
                            <span>Seninle Evrilecek.</span>
                        </h1>

                        <p class="welcome-description">
                            VAERO Engine, varlıklarının yaşamını yönetir,
                            deneyimlerinden öğrenir ve seninle birlikte
                            sürekli gelişir.
                        </p>

                        <div class="welcome-features">

                            <article class="welcome-feature">
                                <span class="welcome-feature-icon">
    <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M20 8c-4.2 0-7 3.2-7 7v1.2A7.5 7.5 0 0 0 10 30a7 7 0 0 0 7 7h1a6 6 0 0 0 6-6V14a6 6 0 0 0-4-6Z"/>
        <path d="M28 8c4.2 0 7 3.2 7 7v1.2A7.5 7.5 0 0 1 38 30a7 7 0 0 1-7 7h-1a6 6 0 0 1-6-6V14a6 6 0 0 1 4-6Z"/>
        <path d="M17 17c3 0 5 2 5 5M31 17c-3 0-5 2-5 5M16 29c3.5 0 6 2.5 6 6M32 29c-3.5 0-6 2.5-6 6"/>
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
                                <span class="welcome-feature-icon">
    <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="4"/>
        <ellipse
            cx="24"
            cy="24"
            rx="17"
            ry="8"
            transform="rotate(-28 24 24)"
        />
        <ellipse
            cx="24"
            cy="24"
            rx="17"
            ry="8"
            transform="rotate(58 24 24)"
        />
        <circle class="welcome-orbit-node" cx="39" cy="17" r="2"/>
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
                                <span class="welcome-feature-icon">
    <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M24 6 39 12v11c0 9.5-5.8 15.5-15 19-9.2-3.5-15-9.5-15-19V12L24 6Z"/>
        <path d="m17 24 5 5 10-11"/>
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
                        <button type="button" aria-label="Aydınlık tema">☀️</button>
                        <button type="button" aria-label="Karanlık tema">☾</button>
                    </div>

                    <div class="welcome-auth-panel">

                        <div class="welcome-auth-logo" aria-hidden="true">
                            V
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
                                    <span aria-hidden="true">✉️</span>

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
                                    <span aria-hidden="true">♙</span>

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
                                        ◉
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
        
        document.body.appendChild(
            screen
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
