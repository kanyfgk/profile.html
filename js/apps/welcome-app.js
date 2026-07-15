const WelcomeApp = {

    storageKey: "vaero:welcome:completed",

    hasCompleted(){

        return localStorage.getItem(
            this.storageKey
        ) === "true";

    },

    complete(){

        localStorage.setItem(
            this.storageKey,
            "true"
        );

        const screen =
            document.getElementById(
                "vaero-welcome-screen"
            );

        if(!screen){
            return;
        }

        screen.classList.add(
            "is-closing"
        );

        window.setTimeout(() => {
            screen.remove();
        }, 450);

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

            <main class="welcome-content">

                <div class="welcome-brand">
                    <strong>VAERO</strong>
                    <span>ENGINE</span>
                </div>

                <section class="welcome-message">
                    <h1>
                        Varlıkların Zekası.
                        <span>
                            Seninle Evrilecek.
                        </span>
                    </h1>

                    <p>
                        Varlıklarını yönet,
                        deneyimlerinden öğren
                        ve seninle birlikte geliş.
                    </p>
                </section>

                <div
                    class="welcome-planet"
                    aria-hidden="true"
                ></div>

                <section class="welcome-actions">

                    <button
                        type="button"
                        class="welcome-primary"
                        data-welcome-action="start"
                    >
                        Başla
                    </button>

                    <div class="welcome-divider">
                        <span></span>
                        <small>veya</small>
                        <span></span>
                    </div>

                    <button
                        type="button"
                        class="welcome-secondary"
                        data-welcome-action="login"
                    >
                        Hesabım Var
                    </button>

                    <p class="welcome-security">
                        🔒 Güvenli. Özel.
                        Senin kontrolünde.
                    </p>

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

                /*
                 * v1 sürümünde iki buton da
                 * mevcut Engine'e giriş yapar.
                 *
                 * Kimlik doğrulama geldiğinde
                 * login action ayrı akışa bağlanacak.
                 */
                this.complete();

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

        if(document.readyState === "loading"){

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
