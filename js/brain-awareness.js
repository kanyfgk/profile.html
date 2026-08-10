const BrainAwareness = {

    currentApp: "home",
    previousApp: null,
    metadata: {},
    enteredAt: Date.now(),

    enter(app, metadata = {}){

        const nextApp =
            String(app || "home")
                .trim()
                .toLowerCase();

        if(this.currentApp !== nextApp){
            this.previousApp =
                this.currentApp;
        }

        this.currentApp =
            nextApp || "home";

        this.metadata =
            metadata &&
            typeof metadata === "object" &&
            !Array.isArray(metadata)
                ? { ...metadata }
                : {};

        this.enteredAt =
            Date.now();

        return this.snapshot();

    },

    current(){

        return this.currentApp || "home";

    },

    snapshot(){

        return {
            app: this.current(),
            previousApp: this.previousApp,
            metadata: {
                ...this.metadata
            },
            enteredAt: this.enteredAt
        };

    },

    reset(){

        this.previousApp =
            this.currentApp;

        this.currentApp =
            "home";

        this.metadata = {};
        this.enteredAt =
            Date.now();

        return this.snapshot();

    }

};

VAERO.register(
    "brainAwareness",
    BrainAwareness
);
