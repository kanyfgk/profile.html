const BrainAwareness = {

    currentApp: null,

    enter(app){

        this.currentApp = app;

    },

    current(){

        return this.currentApp;

    }

};

VAERO.register("brainAwareness", BrainAwareness);
