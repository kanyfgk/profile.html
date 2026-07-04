const Renderer = {

    mountId: "engine",

    render(entity){

        const root = document.getElementById(this.mountId);

        if(!root){
            console.error("Engine root not found");
            return;
        }

        const components = VAERO.get("components");

root.innerHTML = `
<main class="vaero-shell">

    <section class="section">

        ${components.hero(entity)}

        <h1>
            Every universe begins with an Entity.
        </h1>

        <p style="margin-top:18px;color:var(--muted);line-height:1.8;">
            This entity was created by VAERO Engine and rendered through the new interface layer.
        </p>

        ${components.organs(entity)}
        ${components.profile(entity)}

        ${components.bridge()}
        ${components.memory()}
        ${components.guardian()}
        ${components.brain()}

        ${components.actions()}

    </section>

    ${components.navigation()}

${components.modal()}
</main>
`;

    }

};

VAERO.renderer = Renderer;
VAERO.register("renderer", Renderer);
