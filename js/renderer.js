const Renderer = {

    mountId: "engine",

    render(entity){

        const root =
            document.getElementById(
                this.mountId
            );

        if(!root){
            console.error(
                "Engine root not found"
            );
            return;
        }

        const components =
            VAERO.get("components");

        const currentWorld =
            VAERO.engine.currentWorld;

        const rootEntity =
            VAERO.engine.rootEntity ||
            entity;

        const openedEntity =
            VAERO.engine.currentOpenedEntity;

        root.innerHTML = `
            <main class="vaero-shell">

                <section class="section">

                    ${components.hero(rootEntity)}

                    ${
                        openedEntity
                            ? components.entityApp(
                                openedEntity
                              )
                            : currentWorld
                                ? components.worldView(
                                    currentWorld
                                  )
                                : `
    ${components.home()}
`
                    }

                </section>

                ${components.navigation()}

                ${components.modal()}

                ${components.idModal()}

                ${components.brainPanel()}

            </main>
        `;

    },

    renderHome(){

        return `
            <section class="vaero-home">

                <header class="vaero-home-header">

                    <div class="vaero-home-heading">

                        <span class="vaero-home-eyebrow">
                            VAERO ENGINE
                        </span>

                        <h1>
                            Yaşayan Dijital Evren
                        </h1>

                        <p>
                            Dijital kimliğin, bağlantıların ve
                            gelişimin tek bir canlı sistemde
                            birleşiyor.
                        </p>

                    </div>

                    <div class="vaero-engine-status">

                        <span
                            class="vaero-engine-status-dot"
                            aria-hidden="true"
                        ></span>

                        <span>
                            Engine çevrimiçi
                        </span>

                    </div>

                </header>

                <section class="vaero-home-actions">

                    <div class="vaero-home-section-heading">

                        <div>
                            <span>BAŞLANGIÇ</span>

                            <h2>
                                Bugün ne yapmak istiyorsun?
                            </h2>
                        </div>

                        <p>
                            VAERO dünyanda ilerlemek için
                            bir alan seç.
                        </p>

                    </div>

                    <div class="vaero-home-grid">

                        <button
    type="button"
    class="vaero-home-card vaero-home-card-primary"
    data-action="worlds:open"
>
                            <span class="vaero-home-card-icon">
                                <svg viewBox="0 0 24 24">
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="9"
                                    ></circle>

                                    <path
                                        d="M3 12h18"
                                    ></path>

                                    <path
                                        d="M12 3c2.4 2.5 3.7 5.5 3.7 9S14.4 18.5 12 21"
                                    ></path>

                                    <path
                                        d="M12 3C9.6 5.5 8.3 8.5 8.3 12S9.6 18.5 12 21"
                                    ></path>
                                </svg>
                            </span>

                            <span class="vaero-home-card-content">

                                <strong>
                                    Dünyaları Keşfet
                                </strong>

                                <small>
                                    Yeni toplulukları, fikirleri
                                    ve fırsatları keşfet.
                                </small>

                            </span>

                            <span class="vaero-home-card-arrow">
                                →
                            </span>

                        </button>

                        <button
                            type="button"
                            class="vaero-home-card"
                            data-action="profile:open"
                        >

                            <span class="vaero-home-card-icon">
                                <svg viewBox="0 0 24 24">
                                    <circle
                                        cx="12"
                                        cy="8"
                                        r="4"
                                    ></circle>

                                    <path
                                        d="M4.5 21c.8-4.2 3.3-6.5 7.5-6.5s6.7 2.3 7.5 6.5"
                                    ></path>
                                </svg>
                            </span>

                            <span class="vaero-home-card-content">

                                <strong>
                                    Profilim
                                </strong>

                                <small>
                                    Kimliğini, yönünü ve
                                    görünürlüğünü yönet.
                                </small>

                            </span>

                            <span class="vaero-home-card-arrow">
                                →
                            </span>

                        </button>

                        <button
                            type="button"
                            class="vaero-home-card"
                            data-action="brain:open"
                        >

                            <span class="vaero-home-card-icon">
                                <svg viewBox="0 0 24 24">
                                    <path
                                        d="M9.2 4.2A4 4 0 0 0 5 8.1v.7a4 4 0 0 0-1.5 6.8A4 4 0 0 0 7.4 20H10V4.6a3.8 3.8 0 0 0-.8-.4Z"
                                    ></path>

                                    <path
                                        d="M14.8 4.2A4 4 0 0 1 19 8.1v.7a4 4 0 0 1 1.5 6.8A4 4 0 0 1 16.6 20H14V4.6c.3-.2.5-.3.8-.4Z"
                                    ></path>

                                    <path
                                        d="M10 9H7.5"
                                    ></path>

                                    <path
                                        d="M14 9h2.5"
                                    ></path>

                                    <path
                                        d="M10 15H7.5"
                                    ></path>

                                    <path
                                        d="M14 15h2.5"
                                    ></path>
                                </svg>
                            </span>

                            <span class="vaero-home-card-content">

                                <strong>
                                    Brain
                                </strong>

                                <small>
                                    Sorular sor, yön bul ve
                                    sisteminle birlikte düşün.
                                </small>

                            </span>

                            <span class="vaero-home-card-arrow">
                                →
                            </span>

                        </button>

                        <button
                            type="button"
                            class="vaero-home-card"
                            data-action="world:create"
                        >

                            <span class="vaero-home-card-icon">
                                <svg viewBox="0 0 24 24">
                                    <path
                                        d="M12 5v14"
                                    ></path>

                                    <path
                                        d="M5 12h14"
                                    ></path>
                                </svg>
                            </span>

                            <span class="vaero-home-card-content">

                                <strong>
                                    Yeni Dünya
                                </strong>

                                <small>
                                    Bir proje, topluluk veya
                                    dijital yapı başlat.
                                </small>

                            </span>

                            <span class="vaero-home-card-arrow">
                                →
                            </span>

                        </button>

                    </div>

                </section>

                <section class="vaero-home-overview">

                    <div class="vaero-overview-header">

                        <div>
                            <span>EVRENİN</span>

                            <h2>
                                İlk görünüm
                            </h2>
                        </div>

                        <span class="vaero-overview-live">
                            Canlı
                        </span>

                    </div>

                    <div class="vaero-overview-grid">

                        <article class="vaero-overview-item">

                            <span>
                                Kimlik
                            </span>

                            <strong>
                                Hazır
                            </strong>

                            <small>
                                Dijital kimliğin Engine'e bağlı.
                            </small>

                        </article>

                        <article class="vaero-overview-item">

                            <span>
                                Yolculuk
                            </span>

                            <strong>
                                Başladı
                            </strong>

                            <small>
                                İlk keşif seçimlerin kaydedildi.
                            </small>

                        </article>

                        <article class="vaero-overview-item">

                            <span>
                                Bağlantılar
                            </span>

                            <strong>
                                Beklemede
                            </strong>

                            <small>
                                Uygun eşleşmeler zamanla oluşacak.
                            </small>

                        </article>

                    </div>

                </section>

            </section>
        `;

    }

};

VAERO.renderer = Renderer;

VAERO.register(
    "renderer",
    Renderer
);
