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

        root.innerHTML = `
<main class="vaero-shell">

    <section class="section">

        ${components.hero(entity)}

        ${
            currentWorld
            ? components.worldView(currentWorld)
            : `
                <h1>
                    Every universe begins with an Entity.
                </h1>

                <p style="margin-top:18px;color:var(--muted);line-height:1.8;">
                    This entity was created by VAERO Engine and rendered through the new interface layer.
                </p>

                ${components.organs(entity)}

                ${components.bridge()}

                ${components.dashboard(entity)}

                ${components.actions()}
            `
        }

    </section>

    ${components.navigation()}

    ${components.modal()}

    ${components.idModal()}

</main>
`;

    }

};

VAERO.renderer = Renderer;
VAERO.register("renderer", Renderer);
