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

        ${components.bridge()}

        <div style="display:flex;gap:14px;margin-top:32px;">

            <button class="primary-btn">
                Continue
            </button>

            <button class="secondary-btn">
                Documentation
            </button>

        </div>

    </section>

    <nav class="bottom-nav">

        <button class="nav-btn active">
            <div class="nav-icon">⌂</div>
            Home
        </button>

        <button class="nav-btn">
            <div class="nav-icon">ID</div>
            Identity
        </button>

        <button class="nav-btn">
            <div class="nav-icon">＋</div>
            Create
        </button>

        <button class="nav-btn">
            <div class="nav-icon">◌</div>
            World
        </button>

    </nav>

</main>
`;

    }

};

VAERO.renderer = Renderer;
VAERO.register("renderer", Renderer);
