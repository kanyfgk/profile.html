const Actions = {

    openProfile(entity){

        const memory = VAERO.get("memorySystem");

        memory.remember("profile:opened", {
            entityId: entity.id,
            profileName: entity.profile.name
        });
 
        const modal = document.getElementById("profileModal");
        const title = document.getElementById("modalTitle");
        const text = document.getElementById("modalText");

        title.innerText = entity.profile.name;

        text.innerText =
            `Type: ${entity.profile.type}
Identity: ${entity.profile.identity.verified ? "Verified" : "Unverified"}`;

        modal.classList.add("show");

    },

    closeModal(){

        const modal = document.getElementById("profileModal");

        if(modal){
            modal.classList.remove("show");
        }

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
            owner: VAERO.engine.currentEntity.id
        });

        alert(`World "${input.value}" created.`);

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

        alert(`Entering "${world.name}"`);

    }

};

document.addEventListener("click", event => {

    const button = event.target.closest("[data-action]");

    if(!button){
        return;
    }

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
        const worldId = button.dataset.worldId;
        Actions.openWorld(worldId);
    }

});

VAERO.register("actions", Actions);
