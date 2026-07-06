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

                ${(entity.organs || []).map(organ=>`
                    <div style="display:flex;justify-content:space-between;margin-top:10px;color:var(--muted);">
                        <span>${organ.name}</span>
                        <span style="color:var(--green);">${organ.status}</span>
                    </div>
                `).join("")}
            </div>
        `;
    },

    profile(entity){
        return `
            <div class="section" style="margin-top:24px;padding:18px;">
                <div class="eyebrow">PROFILE</div>

                <div style="display:flex;justify-content:space-between;margin-top:10px;color:var(--muted);">
                    <span>Name</span>
                    <span>${entity.profile.name}</span>
                </div>

                <div style="display:flex;justify-content:space-between;margin-top:10px;color:var(--muted);">
                    <span>Type</span>
                    <span>${entity.profile.type}</span>
                </div>

                <div style="display:flex;justify-content:space-between;margin-top:10px;color:var(--muted);">
                    <span>Identity</span>
                    <span style="color:var(--green);">
                        ${entity.profile.identity.verified ? "Verified" : "Unverified"}
                    </span>
                </div>
            </div>
        `;
    },

    identityCard(entity){
        return `
            <div class="section" style="margin-top:24px;padding:18px;">
                <div class="eyebrow">VAERO IDENTITY</div>

                <div style="font-size:26px;font-weight:900;margin-top:10px;">
                    ${entity.profile.name}
                </div>

                <div style="margin-top:8px;color:var(--muted);">
                    ${entity.profile.type.toUpperCase()} · ${entity.profile.identity.verified ? "VERIFIED" : "UNVERIFIED"}
                </div>

                <div style="margin-top:18px;display:grid;gap:10px;">
                    <div style="display:flex;justify-content:space-between;color:var(--muted);">
                        <span>Entity ID</span>
                        <span>${entity.id}</span>
                    </div>

                    <div style="display:flex;justify-content:space-between;color:var(--muted);">
                        <span>Status</span>
                        <span style="color:var(--green);">${entity.status}</span>
                    </div>
                </div>
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

    memory(){
        const memory = VAERO.get("memorySystem");

        return `
            <div class="section" style="margin-top:24px;padding:18px;">
                <div class="eyebrow">MEMORY</div>

                ${memory.all().map(record=>`
                    <div style="margin-top:10px;color:var(--muted);line-height:1.6;">
                        ${record.type}
                    </div>
                `).join("")}
            </div>
        `;
    },

    timeline(){
        const timeline = VAERO.get("timeline");

        return `
            <div class="section" style="margin-top:24px;padding:18px;">
                <div class="eyebrow">TIMELINE</div>

                ${timeline.all().map(event=>`
                    <div style="margin-top:10px;color:var(--muted);line-height:1.6;">
                        ${event.title}
                    </div>
                `).join("")}
            </div>
        `;
    },

    guardian(){
        const guardian = VAERO.get("guardian");

        return `
            <div class="section" style="margin-top:24px;padding:18px;">
                <div class="eyebrow">GUARDIAN</div>
                <p style="color:var(--muted);line-height:1.7;">
                    Guardian active · ${guardian.rules.length} validation rules loaded
                </p>
            </div>
        `;
    },

    brain(){
        const brain = VAERO.get("brain");
        const report = brain.report();

        return `
            <div class="section" style="margin-top:24px;padding:18px;">
                <div class="eyebrow">BRAIN STATUS</div>

                ${Object.entries(report).map(([key,value])=>`
                    <div style="display:flex;justify-content:space-between;margin-top:10px;color:var(--muted);">
                        <span>${key}</span>
                        <span style="color:var(--green);">${value}</span>
                    </div>
                `).join("")}
            </div>
        `;
    },

    alphaCreateWorld(){

        const world = VAERO.get("world");
        const worlds = world ? world.all() : [];

        return `
            <div class="section" style="margin-top:24px;padding:18px;">
                <div class="eyebrow">VAERO ALPHA</div>

                <h2 style="margin-top:10px;">İlk dünyanızı yaratın</h2>

                <p style="color:var(--muted);line-height:1.7;margin-top:10px;">
                    VAERO Evreni içinde inşa etmeye başlayın.
                </p>

                <input
                    id="worldNameInput"
                    placeholder="Benim İlk Dünyam"
                    style="
                        width:100%;
                        margin-top:18px;
                        padding:16px;
                        border-radius:18px;
                        border:1px solid rgba(255,255,255,.10);
                        background:rgba(255,255,255,.06);
                        color:var(--text);
                        font-weight:800;
                    "
                >

                <button class="primary-btn" data-action="world:create" style="width:100%;margin-top:14px;">
                    Dünyayı Yarat
                </button>

                <div style="margin-top:22px;">
                    <div class="eyebrow">SİZİN DÜNYALARINIZ</div>

                    ${worlds.length === 0 ? `
                        <p style="color:var(--muted);line-height:1.7;margin-top:10px;">
                            Henüz özel dünyalar yok.
                        </p>
                    ` : worlds.map(item=>`
                        <button
                            data-action="world:open"
                            data-world-id="${item.id}"
                            style="
                                width:100%;
                                text-align:left;
                                margin-top:10px;
                                padding:14px;
                                border-radius:16px;
                                border:0;
                                background:rgba(255,255,255,.05);
                                color:var(--text);
                                font-weight:800;
                                cursor:pointer;
                            "
                        >
                            🟢 ${item.name}
                        </button>
                    `).join("")}
                </div>
            </div>
        `;
    },

    dashboard(entity){
        return `
            <div class="dashboard-shell">
                ${this.alphaCreateWorld()}
                ${this.identityCard(entity)}
                ${this.profile(entity)}
                ${this.memory()}
                ${this.timeline()}
                ${this.guardian()}
                ${this.brain()}
            </div>
        `;
    },

    worldView(world){

        const entities = world.entities || [];

        if(VAERO.engine.entityCreateMode){

            if(VAERO.engine.entityType){
                return `
                    <div class="section" style="margin-top:24px;padding:24px;">
                        <div class="eyebrow">${VAERO.engine.entityType} OLUŞTUR</div>

                        <h2 style="margin-top:10px;">
                            ${VAERO.engine.entityType} adını belirtin.
                        </h2>

                        <input
                            id="entityNameInput"
                            placeholder="${VAERO.engine.entityType} adı"
                            style="
                                width:100%;
                                margin-top:18px;
                                padding:16px;
                                border-radius:18px;
                                border:1px solid rgba(255,255,255,.10);
                                background:rgba(255,255,255,.06);
                                color:var(--text);
                                font-weight:800;
                            "
                        >

                        <button
                            class="primary-btn"
                            data-action="entity:create"
                            style="width:100%;margin-top:14px;"
                        >
                            ${VAERO.engine.entityType} Oluştur
                        </button>
                    </div>
                `;
            }

            return `
                <div class="section" style="margin-top:24px;padding:24px;">
                    <div class="eyebrow">CREATE ENTITY</div>

                    <h2 style="margin-top:10px;">
                        Ne oluşturmak istiyorsun?
                    </h2>

                    <div style="display:grid;gap:10px;margin-top:18px;">
                        ${["Person","Company","AI","Device","Knowledge","Community","Planet","Custom"].map(type=>`
                            <button
                                class="secondary-btn"
                                data-action="entity:type:select"
                                data-entity-type="${type}"
                                style="width:100%;text-align:left;"
                            >
                                ${type}
                            </button>
                        `).join("")}
                    </div>
                </div>
            `;
        }

        return `
            <div class="section" style="margin-top:24px;padding:24px;">
                <div class="eyebrow">DÜNYA</div>

                <h2 style="margin-top:10px;">
                    ${world.name}
                </h2>

                ${entities.length === 0 ? `
                    <p style="margin-top:12px;color:var(--muted);line-height:1.7;">
                        Bu dünyada henüz hiçbir varlık yok.
                    </p>
                ` : entities.map(entity=>`
                    <button
    data-action="entity:open"
    data-entity-id="${entity.id}"
    style="
        width:100%;
        text-align:left;
        margin-top:12px;
        padding:14px;
        border-radius:16px;
        border:0;
        background:rgba(255,255,255,.05);
        color:var(--text);
        font-weight:800;
        cursor:pointer;
    "
>
    ${entity.type} · ${entity.name}
</button>
                `).join("")}

                <button
                    class="primary-btn"
                    data-action="entity:create:first"
                    style="margin-top:20px;"
                >
                    + İlk Varlığı Oluştur
                </button>
            </div>
        `;
    },

    entityView(entity){

    return `
        <div class="section" style="margin-top:24px;padding:24px;">
        <button
    class="secondary-btn"
    data-action="world:back"
    style="margin-bottom:18px;"
>
    ← Dünyaya Dön
</button>

            <div class="eyebrow">${entity.type.toUpperCase()}</div>

            <h2 style="margin-top:10px;">
                ${entity.name}
            </h2>

            <p style="margin-top:12px;color:var(--muted);">
                Bu varlık başarıyla oluşturuldu.
            </p>

            <div style="
                margin-top:20px;
                padding:16px;
                border-radius:16px;
                background:rgba(255,255,255,.05);
            ">
                <div><b>ID:</b> ${entity.id}</div>
                <div style="margin-top:8px;"><b>Type:</b> ${entity.type}</div>
            </div>

<div class="card" style="margin-top:18px;">
    <div class="grid grid-2">

        <button class="secondary-btn" data-action="entity:profile">
    👤 Profil
</button>

<button class="secondary-btn" data-action="entity:organs">
    🧠 Organlar
</button>

<button class="secondary-btn" data-action="entity:timeline">
    🕓 Timeline
</button>

<button class="secondary-btn" data-action="entity:bridge">
    🌉 Bridge
</button>

<button class="secondary-btn" data-action="entity:memory">
    💾 Memory
</button>

<button class="secondary-btn" data-action="entity:settings">
    ⚙️ Ayarlar
</button>

    </div>
</div>
        </div>
    `;

},

    entityProfile(entity){
    return `
        <div class="section" style="margin-top:24px;padding:24px;">

            <button class="secondary-btn"
                data-action="entity:dashboard"
                style="margin-bottom:18px;">
                ← Entity Dashboard
            </button>

            <div class="eyebrow">ENTITY PROFILE</div>

            <h2 style="margin-top:10px;">
                ${entity.name}
            </h2>

            <div class="card" style="margin-top:18px;padding:16px;">
                <div><b>ID:</b> ${entity.id}</div>
                <div style="margin-top:8px;"><b>Type:</b> ${entity.type}</div>
                <div style="margin-top:8px;"><b>Status:</b> Active</div>
            </div>

        </div>
    `;
},

    entityOrgans(entity){
    return `
        <div class="section" style="margin-top:24px;padding:24px;">
            <button class="secondary-btn" data-action="entity:dashboard" style="margin-bottom:18px;">
                ← Entity Dashboard
            </button>

            <div class="eyebrow">ENTITY ORGANS</div>
            <h2 style="margin-top:10px;">${entity.name}</h2>

            <div class="card" style="margin-top:18px;padding:16px;">
                <p style="color:var(--muted);line-height:1.7;">
                    Bu varlığın organ sistemi burada yönetilecek.
                </p>
            </div>
        </div>
    `;
},

    actions(){
        return `
            <div style="display:flex;gap:14px;margin-top:32px;">
                <button class="primary-btn" data-action="profile:open">
                    Continue
                </button>

                <button class="secondary-btn" data-action="docs:open">
                    Documentation
                </button>
            </div>
        `;
    },

    modal(){
        return `
            <div class="vaero-modal" id="profileModal">
                <div class="modal-card">
                    <h2 id="modalTitle">Profile</h2>
                    <p id="modalText"></p>

                    <button class="primary-btn modal-close" data-action="modal:close">
                        Close
                    </button>
                </div>
            </div>
        `;
    },

    idModal(){
        return `
            <div class="vaero-modal" id="idModal">
                <div class="modal-card">
                    <h2>Platform ID</h2>

                    <p>
                        Enter your VAERO Platform ID to connect your identity.
                    </p>

                    <input
                        id="platformIdInput"
                        placeholder="VA-001"
                        style="
                            width:100%;
                            margin-top:18px;
                            padding:16px;
                            border-radius:18px;
                            border:1px solid rgba(255,255,255,.10);
                            background:rgba(255,255,255,.06);
                            color:var(--text);
                            font-weight:800;
                        "
                    >

                    <button class="primary-btn modal-close" data-action="identity:connect">
                        Connect Identity
                    </button>

                    <button class="secondary-btn modal-close" data-action="idmodal:close" style="width:100%;margin-top:10px;">
                        Close
                    </button>
                </div>
            </div>
        `;
    },

    navigation(){
        return `
            <nav class="bottom-nav">
                <button class="nav-btn active">
                    <div class="nav-icon">⌂</div>
                    Ev
                </button>

                <button class="nav-btn">
                    <div class="nav-icon">ID</div>
                    Kimlik
                </button>

                <button class="nav-btn">
                    <div class="nav-icon">＋</div>
                    Yaratmak
                </button>

                <button class="nav-btn">
                    <div class="nav-icon">◌</div>
                    Dünya
                </button>
            </nav>
        `;
    }

};

VAERO.register("components", Components);
