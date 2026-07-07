const BrainMode = {

    mode: "silent",

    set(mode){
        this.mode = mode;
    },

    get(){
        return this.mode;
    },

    canSpeak(){

        if(this.mode === "silent"){
            return false;
        }

        if(this.mode === "balanced"){
            return true;
        }

        if(this.mode === "active"){
            return true;
        }

        return false;
    }

};

VAERO.register("brainMode", BrainMode);
window.BrainMode = BrainMode;
