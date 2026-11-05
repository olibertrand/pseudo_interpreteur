// callable.js — LoxCallable, LoxFunction, ClockNative : représentation des fonctions appelables
// Dépend de : environment.js, errors.js (ReturnException)

// NOUVEAU pour Chapitre 11 : Interface Callable
class LoxCallable {
    arity() {
        throw new Error("Méthode arity() doit être implémentée");
    }
    
    call(interpreter, args) {
        throw new Error("Méthode call() doit être implémentée");
    }
}

// NOUVEAU pour Chapitre 11 : Fonction définie par l'utilisateur
class LoxFunction extends LoxCallable {
    constructor(declaration, closure) {
        super();
        this.declaration = declaration;
        this.closure = closure; // Environnement capturé pour les closures
    }
    
    arity() {
        return this.declaration.params.length;
    }
    
    call(interpreter, args) {
        // Créer un nouvel environnement pour la fonction
        // avec le closure comme parent (pour supporter les closures)
        const environment = new Environment(this.closure);
        
        // Lier les paramètres aux arguments
        for (let i = 0; i < this.declaration.params.length; i++) {
            environment.define(
                this.declaration.params[i].lexeme,
                args[i]
            );
        }
        
        try {
            // Exécuter le corps de la fonction
            interpreter.executeBlock(this.declaration.body, environment);
        } catch (returnValue) {
            if (returnValue instanceof ReturnException) {
                return returnValue.value;
            }
            throw returnValue;
        }
        
        // Si aucun return, retourner null
        return null;
    }
    
    toString() {
        return `<fonction ${this.declaration.name.lexeme}>`;
    }
}

// NOUVEAU pour Chapitre 11 : Fonction native pour obtenir l'heure
class ClockNative extends LoxCallable {
    arity() {
        return 0;
    }
    
    call(interpreter, args) {
        return Date.now() / 1000.0;
    }
    
    toString() {
        return "<fonction native>";
    }
}

