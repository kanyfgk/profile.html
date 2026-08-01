const Renderer = {

    mountId: "engine",

    render(entity){ 
 
        const root = document.getElementById(this.mountId);
 
        if(!root){ 
            console.error("Engine root not found");
            return; 
        }

        const components = VAERO.get("components");
        const currentWorld = VAERO.engine.currentWorld;
        const rootEntity = VAERO.engine.rootEntity || entity;
        const openedEntity = VAERO.engine.currentOpenedEntity;

        root.innerHTML = `
<main class="vaero-shell">

    <section class="section">

        ${components.hero(rootEntity)}

        ${
    openedEntity
        ? (
            components.entityApp(openedEntity)
)
        : currentWorld
            ? components.worldView(currentWorld)
            : `
                <h1>
                    Yaşayan Dijital Evren
                </h1>

                <p style="margin-top:18px;color:var(--muted);line-height:1.8;">
                    Dijital kimliğin, bağlantıların ve gelişimin tek bir canlı sistemde birleşiyor.
                </p>

                // ${components.organs(rootEntity)}

                // ${components.bridge()}

                <section class="vaero-home">

    <h2>Bugün ne yapmak istiyorsun?</h2>

    <div class="vaero-home-grid">

        <button class="vaero-card">
            🌍
            <span>Dünyaları Keşfet</span>
        </button>

        <button class="vaero-card">
            👤
            <span>Profilim</span>
        </button>

        <button class="vaero-card">
            🧠
            <span>Brain</span>
        </button>

        <button class="vaero-card">
            ➕
            <span>Yeni Dünya</span>
        </button>

    </div>

</section>

                ${components.actions()}
            `
        }

    </section>

    ${components.navigation()}

    ${components.modal()}

    ${components.idModal()}
    
    ${components.brainPanel()}

</main>
`;

    }

};

VAERO.renderer = Renderer;
VAERO.register("renderer", Renderer);
