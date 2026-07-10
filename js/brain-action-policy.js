const BrainActionPolicy = {

    levels: {
        SAFE: "safe",
        CONFIRM: "confirm",
        BLOCKED: "blocked"
    },

    rules: {
        "app:open": "safe",
        "field:update": "safe",
        "draft:create": "safe",
        "search:run": "safe",
        "session:save": "safe",
        "filter:apply": "safe",

        "content:publish": "confirm",
        "message:send": "confirm",
        "record:delete": "confirm",
        "purchase:complete": "confirm",
        "form:submit": "confirm",

        "payment:execute": "blocked",
        "identity:transfer": "blocked",
        "ownership:change": "blocked"
    },

    check(actionType){
        return this.rules[actionType] || this.levels.CONFIRM;
    },

    canExecute(actionType){
        return this.check(actionType) === this.levels.SAFE;
    },

    needsConfirmation(actionType){
        return this.check(actionType) === this.levels.CONFIRM;
    },

    isBlocked(actionType){
        return this.check(actionType) === this.levels.BLOCKED;
    },

    evaluate(action){
        const actionType = action?.type || "";
        const permission = this.check(actionType);

        return {
            allowed: permission === this.levels.SAFE,
            requiresConfirmation: permission === this.levels.CONFIRM,
            blocked: permission === this.levels.BLOCKED,
            permission,
            action
        };
    }

};

VAERO.register("brainActionPolicy", BrainActionPolicy);
