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

});

VAERO.register("actions", Actions);
