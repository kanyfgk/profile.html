const OrganStatus = {

    getMemoryStatus(){

        const memory = VAERO.get("memorySystem");

        const records =
            memory &&
            typeof memory.all === "function"
                ? memory.all()
                : [];

        return {
            id: "memory",
            label: "Hafıza",
            status: memory ? "active" : "missing",
            total: records.length,
            lifeEvents: records.filter(
                record => record.type === "life-event"
            ).length
        };

    },

    getTimelineStatus(){

        const timeline = VAERO.get("timeline");

        const events =
            timeline &&
            typeof timeline.all === "function"
                ? timeline.all()
                : [];

        return {
            id: "timeline",
            label: "Timeline",
            status: timeline ? "active" : "missing",
            total: events.length,
            lifeEvents: events.filter(
                event => event.type === "life-event"
            ).length
        };

    },

    getEvolutionStatus(){

        const evolution = VAERO.get("evolution");

        const history =
            evolution &&
            typeof evolution.all === "function"
                ? evolution.all()
                : [];

        return {
            id: "evolution",
            label: "Evolution",
            status: evolution ? "active" : "missing",
            total: history.length,
            important: history.filter(
                event =>
                    event.importance === "high" ||
                    event.importance === "critical"
            ).length
        };

    },

    all(){

        return [
            this.getEvolutionStatus(),
            this.getMemoryStatus(),
            this.getTimelineStatus()
        ];

    }

};

VAERO.register("organStatus", OrganStatus);
