// environment.js — Environment : gère les portées de variables (avec chaînage pour les closures)
// Dépend de : errors.js (RuntimeError)

// Environnement pour les variables avec support des closures
class Environment {
    constructor(enclosing = null) {
        this.enclosing = enclosing;
        this.values = new Map();
    }
    
    define(name, value) {
        this.values.set(name, value);
    }
    
    get(name) {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme);
        }
        
        if (this.enclosing !== null) return this.enclosing.get(name);
        
        throw new RuntimeError(name, `Variable non définie '${name.lexeme}'.`);
    }
    
    assign(name, value) {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value);
            return;
        }
        
        if (this.enclosing !== null) {
            this.enclosing.assign(name, value);
            return;
        }
        
        //throw new RuntimeError(name, `Variable non définie '${name.lexeme}'.`);
        // Variable inconnue : on la crée dans cet environnement
        this.define(name.lexeme, value);
    }
}

