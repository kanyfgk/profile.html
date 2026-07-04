const DNA = {

    version: "1.0",

    name: "VAERO DNA",

    principles: [
        "Everything is an Entity",
        "Everything is Connected",
        "Everything has Identity",
        "Everything has Memory",
        "Everything has a Timeline",
        "Everything Evolves",
        "Nothing depends on a single technology", 
        "Everything can be reconstructed"
    ],

    laws: {
        entity: "Every object, person, system, world, device, idea or memory can exist as an Entity.",
        connection: "Every Entity can be connected through Bridges.",
        memory: "Every meaningful event can be remembered.",
        timeline: "Every action belongs to time.",
        evolution: "Every system can change without losing its origin.",
        independence: "VAERO Core must not depend on any platform, device, database, company or era.",
        reconstruction: "A valid Entity should be understandable and reconstructable in the future."
    },

    describe(){

        return {
            version: this.version,
            name: this.name,
            principles: this.principles,
            laws: this.laws
        };

    }

};

VAERO.register("dna", DNA);
