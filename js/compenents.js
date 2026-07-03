const Components = {

    hero(entity){ 

        return `
            <div class="brand-header">
                <div class="brand-mark">${entity.name.charAt(0)}</div>

                <div>
                    <div class="brand-title">${entity.name}</div>
                    <div class="brand-subtitle">${entity.description}</div>

                    <div class="status-pill">
                        <span class="status-dot"></span>
                        ${entity.status === "online" ? "Engine Online" : entity.status}
                    </div>
                </div>
            </div>
        `;

    },

    organs(entity){

        return `
            <div class="section" style="margin-top:24px;padding:18px;">
                <div class="eyebrow">CONNECTED ORGANS</div>

                ${entity.organs.map(organ=>`
                    <div style="display:flex;justify-content:space-between;margin-top:10px;color:var(--muted);">
                        <span>${organ.name}</span>
                        <span style="color:var(--green);">${organ.status}</span>
                    </div>
                `).join("")}
            </div>
        `;

    },

    bridge(){

        return `
            <div class="section" style="margin-top:24px;padding:18px;">
                <div class="eyebrow">FIRST BRIDGE</div>

                <p style="color:var(--muted);line-height:1.7;">
                    VAERO is now connected to its first community bridge.
                </p>
            </div>
        `;

    },

    navigation(){

        return `
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
        `;

    }

};

VAERO.register("components", Components);
