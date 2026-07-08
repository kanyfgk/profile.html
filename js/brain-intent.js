const BrainIntent = {

    detect(message){

        const raw = String(message || "").toLowerCase().trim();

        const text = raw
            .replaceAll("ı","i")
            .replaceAll("ğ","g")
            .replaceAll("ü","u")
            .replaceAll("ş","s")
            .replaceAll("ö","o")
            .replaceAll("ç","c");

        const words = text.split(/[^a-z0-9]+/).filter(Boolean);

        if(text === ""){
            return { type: "empty", target: null };
        }

        if(
            text.includes("bridge") ||
            text.includes("baglanti") ||
            text.includes("kopru")
        ){
            return { type: "navigate", target: "bridge" };
        }

        if(
            text.includes("kimlik") ||
            text.includes("kimligi") ||
            text.includes("identity") ||
            words.includes("id")
        ){
            return { type: "navigate", target: "identity" };
        }

        if(text.includes("profil") || text.includes("profile")){
            return { type: "navigate", target: "profile" };
        }

        if(text.includes("hafiza") || text.includes("memory")){
            return { type: "navigate", target: "memory" };
        }

        if(text.includes("timeline") || text.includes("zaman")){
            return { type: "navigate", target: "timeline" };
        }

        if(text.includes("ayar") || text.includes("settings")){
            return { type: "navigate", target: "settings" };
        }

        if(text.includes("organ")){
            return { type: "navigate", target: "organs" };
        }

        if(
            text === "ne" ||
            text === "ne?" ||
            text.includes("ne demek") ||
            text.includes("anlamadim")
        ){
            return { type: "clarify", target: null };
        }

        return { type: "chat", target: null };
    }

};

VAERO.register("brainIntent", BrainIntent);
