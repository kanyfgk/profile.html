const Renderer = {

    mountId: "engine",

    render(){

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
                        V
                    </div>

                    <div>

                        <div class="brand-title">
                            VAERO
                        </div>

                        <div class="brand-subtitle">
                            Living Digital Universe
                        </div>

                        <div class="status-pill">

                            <span class="status-dot"></span>

                            Engine Online

                        </div>

                    </div>

                </div>

                <h1>
                    Every universe begins with an Entity.
                </h1>

                <p style="margin-top:18px;color:var(--muted);line-height:1.8;">

                    This is the first generation of the new VAERO Engine.

                    Everything from this point forward will be generated through the Brain.

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

        </main>
        `;

    }

};

VAERO.renderer = Renderer;
