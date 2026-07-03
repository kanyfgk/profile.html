const VAERO = {

    version: "1.0",

    engine: null,

    renderer: null,

    organs: {},

    register(name, object){

        this.organs[name] = object;

    }

};
