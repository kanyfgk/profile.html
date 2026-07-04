const Runtime = {

    status: "idle",
    startedAt: null,
    ticks: 0,

    boot(){

        this.status = "running";
        this.startedAt = Date.now();

        const events = VAERO.get("events"); 

        events.emit("runtime.started", {
            status: this.status,
            startedAt: this.startedAt
        });

        this.tick();

    },

    tick(){

        this.ticks++;

        const events = VAERO.get("events");

        events.emit("runtime.tick", {
            ticks: this.ticks,
            time: Date.now()
        });

    },

    report(){

        return {
            status: this.status,
            startedAt: this.startedAt,
            ticks: this.ticks
        };

    }

};

VAERO.register("runtime", Runtime);
