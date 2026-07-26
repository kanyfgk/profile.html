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
                <p class="welcome-eyebrow">
                    KİŞİSEL EVRİM SİSTEMİ
                </p>

                <h1>
                    Hayatını tek bir
                    <span>zekâda birleştir.</span>
                </h1>

                <p class="welcome-description">
                    Kimliğini, hedeflerini ve gelişimini anlayan;
                    seninle birlikte öğrenip evrilen kişisel sistemin.
                </p>

                <div class="welcome-features">

                    <article class="welcome-feature">
                        <span class="welcome-feature-icon">01</span>

                        <div>
                            <strong>Kendini keşfet</strong>
                            <p>Kimliğini ve yönünü görünür hâle getir.</p>
                        </div>
                    </article>

                    <article class="welcome-feature">
                        <span class="welcome-feature-icon">02</span>

                        <div>
                            <strong>Hayatını birleştir</strong>
                            <p>Deneyimlerini ve hedeflerini tek merkezde yönet.</p>
                        </div>
                    </article>

                    <article class="welcome-feature">
                        <span class="welcome-feature-icon">03</span>

                        <div>
                            <strong>Seninle evrilsin</strong>
                            <p>VAERO seni tanıdıkça daha güçlü hâle gelsin.</p>
                        </div>
                    </article>

                </div>
            </div>

        </section>

        <section class="welcome-right">

            <div class="welcome-auth-panel">

                <div class="welcome-auth-heading">
                    <p>TEKRAR HOŞ GELDİN</p>
                    <h2>VAERO’ya giriş yap</h2>
                    <span>
                        Kaldığın yerden devam etmek için bilgilerini gir.
                    </span>
                </div>

                <form class="welcome-auth-form">

                    <label>
                        <span>E-posta</span>

                        <input
                            type="email"
                            name="email"
                            placeholder="ornek@email.com"
                            autocomplete="email"
                        >
                    </label>

                    <label>
                        <span>Şifre</span>

                        <input
                            type="password"
                            name="password"
                            placeholder="Şifreni gir"
                            autocomplete="current-password"
                        >
                    </label>

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

                <p class="welcome-security">
                    Güvenli · Özel · Senin kontrolünde
                </p>

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
