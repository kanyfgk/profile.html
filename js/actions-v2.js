const Actions = {

    openProfile(entity){
        const memory = VAERO.get("memorySystem"); 

        memory.remember("profile:opened", {
            entityId: entity.id,
            profileName: entity.profile.name
        });
    },

    closeModal(){
        const modal = document.getElementById("profileModal");
        if(modal) modal.classList.remove("show");
    },

    createWorld(){
        const input = document.getElementById("worldNameInput");

        if(!input || input.value.trim() === ""){
            alert("Please enter a world name.");
            return;
        }

        const worldService = VAERO.get("world");

        worldService.create({
            id: crypto.randomUUID(),
            name: input.value,
            type: "custom-world",
            owner: VAERO.engine.currentEntity.id,
            entities: []
        });

        VAERO.engine.mount(VAERO.engine.currentEntity);
        input.value = "";
    },

    openWorld(worldId){
        const worldService = VAERO.get("world");
        const world = worldService.all().find(item => item.id === worldId);

        if(!world){
            alert("World not found.");
            return;
        }

        if(!world.entities) world.entities = [];

        VAERO.engine.currentWorld = world;
        VAERO.engine.mount(VAERO.engine.currentEntity);
    },

    createEntity(){
        const input = document.getElementById("entityNameInput");

        if(!input || input.value.trim() === ""){
            alert("Please enter a name.");
            return;
        }

        const currentWorld = VAERO.engine.currentWorld;

        if(!currentWorld){
            alert("No world selected.");
            return;
        }

        if(!currentWorld.entities) currentWorld.entities = [];

        const entityManager = VAERO.get("entityManager");

        const entity = entityManager.create({
            id: crypto.randomUUID(),
            name: input.value,
            type: VAERO.engine.entityType
        });

        currentWorld.entities.push(entity);

        VAERO.engine.entityCreateMode = false;
        VAERO.engine.entityType = null;

        VAERO.engine.mount(VAERO.engine.currentEntity);
    },

    openEntity(entityId){
        const world = VAERO.engine.currentWorld;
        if(!world) return;

        const entity = (world.entities || []).find(item => item.id === entityId);

        if(!entity){
            alert("Entity not found.");
            return;
        }

        VAERO.engine.currentOpenedEntity = entity;
        VAERO.engine.currentEntityPage = null;

        VAERO.engine.mount(VAERO.engine.currentEntity);
    },

    openEntityPage(page){
    VAERO.engine.currentEntityPage = page;
    console.log("OPEN ENTITY PAGE:", page);    
    console.log("openEntityPage çalıştı:", page);    
    VAERO.engine.mount(VAERO.engine.currentEntity);

    this.trackBrainSession(page);
},

    trackBrainSession(page){
    const brain = VAERO.get("brain");
    if(!brain) return;

    if(!brain.sessions){
        brain.sessions = [];
    }

    const titleMap = {
        profile: "Profil Oturumu",
        identity: "Kimlik Oturumu",
        organs: "Organ Oturumu",
        timeline: "Timeline Oturumu",
        memory: "Hafıza Oturumu",
        bridge: "Bridge Oturumu",
        settings: "Ayarlar Oturumu"
    };

    const actionMap = {
        profile: "Profili açtı",
        identity: "Kimliğe geçti",
        organs: "Organları görüntüledi",
        timeline: "Zaman çizelgesini açtı",
        memory: "Hafızayı görüntüledi",
        bridge: "Bridge bölümüne geçti",
        settings: "Ayarları açtı"
    };

    const title = titleMap[page] || "Entity Oturumu";
    const action = actionMap[page] || "Entity ekranına geçti";

    let session = brain.sessions.find(s =>
        s.title === title &&
        s.status === "progress"
    );

    if(!session){
        session = {
            id: crypto.randomUUID(),
            title,
            status: "progress",
            startedAt: Date.now(),
            updatedAt: Date.now(),
            actions: [],
            favorite: false,
            summary: null
        };

        brain.sessions.unshift(session);
    }

    session.updatedAt = Date.now();

    if(!session.actions.includes(action)){
        session.actions.push(action);
    }

    this.renderBrainHistory();
},

    openBrain(){
    document.querySelectorAll("#brainPanel").forEach(panel => panel.remove());

    if(window.BrainApp){
        document.body.insertAdjacentHTML("beforeend", BrainApp.render());
    }

    const panel = document.getElementById("brainPanel");
    if(!panel) return;

    panel.style.display = "block";
        this.initBrainSessionDragClose();
        this.initBrainPanelAdaptiveSize();

    const contextText = document.getElementById("brainContextText");
    const brainContext = VAERO.get("brainContext");

    if(contextText && brainContext){
        const context = brainContext.build();
        const appName = context.app || "bilinmeyen";
        contextText.innerText = "Şu an " + appName + " ekranındasın.";
    }

    this.renderBrainHistory();
},

closeBrain(){
    document.querySelectorAll("#brainPanel").forEach(panel => panel.remove());
},

sendBrainMessage(){
    const input = document.getElementById("brainInput");
    if(!input) return;

    const text = input.value.trim();
    if(text === "") return;

    const brain = VAERO.get("brain");
    const brainContext = VAERO.get("brainContext");
    const context = brainContext ? brainContext.build() : null;

    if(brain && typeof brain.receive === "function"){
    brain.receive(text, context);

const handledByIntent = this.dispatchBrainIntent(text);

    if (handledByIntent) {
    input.value = "";

    setTimeout(() => {
        document.querySelectorAll("#brainPanel").forEach(panel => panel.remove());

        if(window.BrainApp){
            document.body.insertAdjacentHTML("beforeend", BrainApp.render());
        }

        const panel = document.getElementById("brainPanel");
        if(panel){
            panel.style.display = "block";
        }

        this.renderBrainHistory();
    }, 50);

    return;
}
    if (!brain.sessions) {
        brain.sessions = [];
    }

    let session = brain.sessions.find(s =>
        s.title === text &&
        s.status === "progress"
    );

    if (!session) {
        session = {
            id: crypto.randomUUID(),
            title: text,
            status: "progress",
            startedAt: Date.now(),
            updatedAt: Date.now(),
            actions: [text],
            favorite: false,
            summary: null
        };

        brain.sessions.unshift(session);
    } else {
        session.updatedAt = Date.now();

        if (!session.actions.includes(text)) {
            session.actions.push(text);
        }
    }
}

    input.value = "";

    setTimeout(() => {

        document.querySelectorAll("#brainPanel").forEach(panel => panel.remove());

        if(window.BrainApp){
            document.body.insertAdjacentHTML("beforeend", BrainApp.render());
        }

        const panel = document.getElementById("brainPanel");
        if(panel){
            panel.style.display = "block";
        }

        const contextText = document.getElementById("brainContextText");
        const newContext = brainContext ? brainContext.build() : null;

        if(contextText && newContext){
            contextText.innerText = "Şu an " + (newContext.app || "bilinmeyen") + " ekranındasın.";
        }

        this.renderBrainHistory();

    }, 50);
},

    dispatchBrainIntent(text){
    const command = String(text || "").toLowerCase();
        if (
    command.includes("burada kaldık") ||
    command.includes("burda kaldık") ||
    command.includes("sonra devam") ||
    command.includes("bunu kaydet") ||
    command.includes("kaldığımız yeri kaydet")
) {
    this.saveBrainResumePoint(text);
    return true;
}

        if (
    command.includes("nerede kalmıştık") ||
    command.includes("kaldığımız yer") ||
    command.includes("devam et") ||
    command.includes("kaldığım yer")
) {
    this.restoreBrainResumePoint();
    return true;
}
        

    if(command.includes("profil")){
        this.openEntityPage("profile");
        this.closeBrain();
        return true;
    }

    if(command.includes("kimlik")){
        this.openEntityPage("identity");
        this.closeBrain();
        return true;
    }

    if(command.includes("hafıza") || command.includes("hafiza") || command.includes("memory")){
        this.openEntityPage("memory");
        this.closeBrain();
        return true;
    }

    if(command.includes("köprü") || command.includes("kopru") || command.includes("bridge")){
        this.openEntityPage("bridge");
        this.closeBrain();
        return true;
    }

    if(command.includes("timeline") || command.includes("zaman")){
        this.openEntityPage("timeline");
        this.closeBrain();
        return true;
    }

    if(command.includes("organ")){
        this.openEntityPage("organs");
        this.closeBrain();
        return true;
    }

    if(command.includes("ayar")){
        this.openEntityPage("settings");
        this.closeBrain();
        return true;
    }

    return false;
},

    saveBrainResumePoint(note){
    const brain = VAERO.get("brain");
    const brainContext = VAERO.get("brainContext");
    if(!brain) return;

    const context = brainContext ? brainContext.build() : null;

    const activeSession = (brain.sessions || []).find(s => 
        s.status === "progress"
    );

    brain.resumePoint = {
        id: crypto.randomUUID(),
        sessionId: activeSession ? activeSession.id : null,
        sessionTitle: activeSession ? activeSession.title : null,
        app: context ? context.app : null,
        page: VAERO.engine.currentEntityPage || null,
        note: note,
        savedAt: Date.now()
    };

    if(activeSession){
        activeSession.updatedAt = Date.now();

        if(!activeSession.actions.includes("Devam noktası kaydedildi")){
            activeSession.actions.push("Devam noktası kaydedildi");
        }
    }

    this.renderBrainHistory();

    console.log("Brain Resume Point:", brain.resumePoint);
},

    restoreBrainResumePoint(){

    const brain = VAERO.get("brain");

    if(!brain || !brain.resumePoint){
        alert("Kayıtlı bir devam noktası bulunamadı.");
        return;
    }

    const point = brain.resumePoint;

    if(point.page){
        VAERO.engine.currentEntityPage = point.page;
    }

    VAERO.engine.mount(VAERO.engine.currentEntity);

    console.log("Brain Resume:", point);

},
    
renderBrainHistory() {
    const history = document.getElementById("brainHistory");
    const brain = VAERO.get("brain");

    if (!history || !brain) return;

    history.innerHTML = "";

    const sessions = brain.sessions || [];

    sessions
        .slice(-8)
        .reverse()
        .forEach(session => {

            const card = document.createElement("div");
            card.className = "brain-session-card";
            card.dataset.open = "false";

            const sessionDate = new Date(session.updatedAt || session.startedAt || Date.now());
            const date = sessionDate.toLocaleDateString("tr-TR");
            const time = sessionDate.toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit"
            });

            const status = {
                done: "🟢 Tamamlandı",
                progress: "🟡 Devam Ediyor",
                error: "🔴 Sorun"
            };

            card.innerHTML = `
                <div class="brain-session-head">
                    <div>
                        <strong>${session.title}</strong>
                        <small>${date} · ${time}</small>
                    </div>

                    <span>${status[session.status]}</span>
                </div>

                <div class="brain-session-body">
                    ${session.actions.map(a => `<p>- ${a}</p>`).join("")}
                </div>
            `;

            card.addEventListener("click", () => {

                const isOpen = card.dataset.open === "true";

                document
                    .querySelectorAll(".brain-session-card")
                    .forEach(other => {
                        if (other !== card) {
                            other.dataset.open = "false";
                        }
                    });

                if (!isOpen) {
                    card.dataset.open = "true";
                    return;
                }

                this.openBrainSession(session);

            });

            history.appendChild(card);

        });
},

    openBrainSession(session){
    if(!session) return;

    const source = `${session.title || ""} ${(session.actions || []).join(" ")}`
        .toLowerCase();

    let page = null;

    if(source.includes("profil")){
        page = "profile";
    } else if(source.includes("kimlik")){
        page = "identity";
    } else if(
        source.includes("hafıza") ||
        source.includes("hafiza") ||
        source.includes("memory")
    ){
        page = "memory";
    } else if(
        source.includes("köprü") ||
        source.includes("kopru") ||
        source.includes("bridge")
    ){
        page = "bridge";
    } else if(
        source.includes("timeline") ||
        source.includes("zaman")
    ){
        page = "timeline";
    } else if(source.includes("organ")){
        page = "organs";
    } else if(source.includes("ayar")){
        page = "settings";
    }

    if(!page){
        console.log("Brain Session için yönlendirme bulunamadı:", session);
        return;
    }

    this.closeBrain();

requestAnimationFrame(() => {
    this.openEntityPage(page);
});
},

    initBrainPanelAdaptiveSize(){
    const panel = document.querySelector(".brain-panel");
    const input = document.getElementById("brainInput");
    const history = document.getElementById("brainHistory");

    if(!panel) return;

    panel.classList.remove("is-expanded");
    panel.classList.add("is-compact");

    const expandPanel = () => {
        panel.classList.remove("is-compact");
        panel.classList.add("is-expanded");
    };

    const compactPanel = event => {
        if(panel.contains(event.target)) return;

        const openSession = panel.querySelector(
            '.brain-session-card[data-open="true"]'
        );

        if(openSession) return;

        panel.classList.remove("is-expanded");
        panel.classList.add("is-compact");
    };

    if(input){
        input.addEventListener("focus", expandPanel);
        input.addEventListener("click", expandPanel);
    }

    if(history){
        history.addEventListener("click", expandPanel);
    }

    document.addEventListener("pointerdown", compactPanel, {
        once: true
    });
},
    
    initBrainSessionDragClose() {
    const panel = document.querySelector(".brain-panel");
    if (!panel) return;

    let startX = 0;
    let startY = 0;

    panel.addEventListener("pointerdown", event => {
        startX = event.clientX;
        startY = event.clientY;
    });

    panel.addEventListener("pointermove", event => {
        const movedX = Math.abs(event.clientX - startX);
        const movedY = Math.abs(event.clientY - startY);

        if (movedX < 8 && movedY < 8) return;

        panel.classList.add("is-dragging");

        panel
            .querySelectorAll('.brain-session-card[data-open="true"]')
            .forEach(card => {
                card.dataset.open = "false";
            });
    });

    panel.addEventListener("pointerup", () => {
        panel.classList.remove("is-dragging");
    });

    panel.addEventListener("pointerleave", () => {
        panel.classList.remove("is-dragging");
    });
},

};

document.addEventListener("click", event => {

    const button = event.target.closest("[data-action]");
    if(!button) return;

    const action = button.dataset.action;

    if(action === "profile:open"){
        Actions.openProfile(VAERO.engine.currentEntity);
    }

    if(action === "modal:close"){
        Actions.closeModal();
    }

    if(action === "world:create"){
        Actions.createWorld();
    }

    if(action === "world:open"){
        Actions.openWorld(button.dataset.worldId);
    }

    if(action === "world:back"){
        VAERO.engine.currentEntityPage = null;
        VAERO.engine.currentOpenedEntity = null;
        VAERO.engine.mount(VAERO.engine.currentEntity);
    }

    if(action === "entity:dashboard"){
        Actions.openEntityPage(null);
    }

    if(action === "brain:open"){
        Actions.openBrain();
    }

    if(action === "brain:close"){
        Actions.closeBrain();
    }

    if(action === "brain:send"){
        Actions.sendBrainMessage();
    }

    if(action === "entity:identity"){
        Actions.openEntityPage("identity");
    }

    if(action === "entity:profile"){
        Actions.openEntityPage("profile");
    }

    if(action === "entity:organs"){
        Actions.openEntityPage("organs");
    }

    if(action === "entity:timeline"){
        Actions.openEntityPage("timeline");
    }

    if(action === "entity:memory"){
        Actions.openEntityPage("memory");
    }

    if(action === "entity:bridge"){
        Actions.openEntityPage("bridge");
    }

    if(action === "entity:settings"){
        Actions.openEntityPage("settings");
    }

    if(action === "entity:create:first"){
        VAERO.engine.entityCreateMode = true;
        VAERO.engine.mount(VAERO.engine.currentEntity);
    }

    if(action === "entity:type:select"){
        VAERO.engine.entityType = button.dataset.entityType;
        VAERO.engine.mount(VAERO.engine.currentEntity);
    }

    if(action === "entity:create"){
        Actions.createEntity();
    }

    if(action === "entity:open"){
        Actions.openEntity(button.dataset.entityId);
    }

});

VAERO.register("actions", Actions);

