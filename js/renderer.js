const Renderer = {

    mountId: "engine",

    render(entity){

        const root = document.getElementById(this.mountId);

        if(!root){
            console.error("Engine root not found");
            return;
        }

        root.innerHTML = `
        <main class="vaero-shell">

            <section class="section">

                <div class="brand-header">

                    <div class="brand-mark">
                        ${entity.name.charAt(0)}
                    </div>

                    <div>

                        <div class="brand-title">
                            ${entity.name}
                        </div>

                        <div class="brand-subtitle">
                            ${entity.description}
                        </div>

                        <div class="status-pill">

                            <span class="status-dot"></span>

                            ${entity.status === "online" ? "Engine Online" : entity.status}

                        </div>

                    </div>

                </div>

                <h1>
                    Every universe begins with an Entity.
                </h1>

                <p style="margin-top:18px;color:var(--muted);line-height:1.8;">

                    This entity was created by VAERO Engine and rendered through the new interface layer.

                </p>

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
