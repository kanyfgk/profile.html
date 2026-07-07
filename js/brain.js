const Brain = {

    history: [],

    report(){

        const identity = VAERO.get("identity"); 
        const memory = VAERO.get("memorySystem");
        const guardian = VAERO.get("guardian");
        const bridge = VAERO.get("bridge");
        const evolution = VAERO.get("evolution");

        return {
            identity: identity ? "OK" : "MISSING",
            memory: memory ? "OK" : "MISSING",
            guardian: guardian ? "OK" : "MISSING",
            bridge: bridge ? "OK" : "MISSING",
            evolution: evolution ? "OK" : "MISSING",
            integrity: "100%"
        };

    },

    renderHistory(){

    const history = document.getElementById("brainHistory");

    if(!history){
        return;
    }

    history.innerHTML = this.history
        .filter(item => item.role !== "system")
.map(item => `
            <div style="
                margin-bottom:10px;
                padding:10px 12px;
                border-radius:14px;
                background:${item.role === "user" ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.04)"};
            ">
                ${item.role === "user" ? "👤" : "🧠"} ${item.text}
            </div>
        `)
        .join("");

},

    receive(message){

        this.history.push({
            role: "user",
            text: message,
            createdAt: Date.now()
        });

        console.log("Brain received:", message);
        console.log("Brain history:", this.history);

        this.renderHistory();
        this.history.push({
    role: "system",
    text: `Context: ${VAERO.get("brainAwareness").current() || "unknown"}`,
    createdAt: Date.now()
});
        const reply = this.reply(message);

this.history.push({
    role: "brain",
    text: reply,
    createdAt: Date.now()
});

this.renderHistory();

    },

    reply(message){

    const text = message.toLowerCase();
    const awareness = VAERO.get("brainAwareness");
    const app = awareness ? awareness.current() : null;

    if(text.includes("merhaba")){
        return "Merhaba. VAERO yanınızda.";
    }

    if(app === "profile"){
        return "Profil ekranındasınız. Burada kimliğinizi, seviyenizi ve profil bilgilerinizi güçlendirebiliriz.";
    }

    if(app === "identity"){
        return "Kimlik ekranındasınız. VA kimliği, doğrulama ve yetki katmanlarını buradan yönetebilirsiniz.";
    }

    if(app === "organs"){
        return "Organ Launcher ekranındasınız. Buradan Kimlik, Profil, Hafıza, Timeline, Bridge ve Ayarlar uygulamalarına geçebilirsiniz.";
    }

    if(app === "memory"){
        return "Hafıza ekranındasınız. Burada kayıtlarınızı, notlarınızı ve geçmiş izlerinizi düzenleyebiliriz.";
    }

    if(app === "timeline"){
        return "Timeline ekranındasınız. Olaylarınızı kronolojik olarak takip edebiliriz.";
    }

    if(app === "bridge"){
        return "Bridge ekranındasınız. Bağlantılarınızı ve ilişkilerinizi yönetebiliriz.";
    }

    if(app === "settings"){
        return "Ayarlar ekranındasınız. Görünürlük, izinler ve güvenlik tercihlerini buradan yönetebilirsiniz.";
    }

    if(text.includes("kimlik")){
        return "Kimlik uygulamasına geçerek VA kimliğini inceleyebiliriz.";
    }

    if(text.includes("profil")){
        return "Profil uygulamasında görünümünü, seviyeni ve temel bilgilerini geliştirebiliriz.";
    }

    return "Mesajınızı aldım. Bulunduğunuz ekrana göre yardımcı olmaya hazırım.";

},
    
    boot(){

        const status = this.report();

        console.log("VAERO Brain Online");
        console.log(status);

        const events = VAERO.get("events");

        if(events){
            events.on("engine.started", (data) => {
                console.log("Brain received:", data);
            });

            events.emit("brain.online", status);
        }

        return status;

    }

};

VAERO.register("brain", Brain);
