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
                src="assets/welcome/vaero-earth.webp"
                alt=""
            >

        </picture>
    </div>

    <div class="welcome-layout">

        <section class="welcome-left">

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

        </section>

        <section class="welcome-right">

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

        </section>

    </div>
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

        if(action === "start"){

            if(window.DiscoveryApp){
                window.DiscoveryApp.render(
    document.getElementById("engine")
);
            }

            this.complete(false);
            return;

        }

        if(action === "login"){

            this.complete();
            return;

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
