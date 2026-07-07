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
            .map(item => `<div style="margin-bottom:8px;">👤 ${item.text}</div>`)
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
