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
                    Her evren bir Varlıkla başlar.
                </h1>

                <p style="margin-top:18px;color:var(--muted);line-height:1.8;">
                    Bu varlık VAERO Engine tarafından oluşturuldu ve yeni arayüz katmanı aracılığıyla görüntülendi.
                </p>

                ${components.organs(rootEntity)}

                ${components.bridge()}

                ${components.dashboard(rootEntity)}

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
