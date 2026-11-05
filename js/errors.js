// errors.js — Classes d'erreurs et exceptions internes
// ParseError (erreurs de syntaxe), RuntimeError (erreurs d'exécution), ReturnException (mécanisme de 'retourner')

// Exceptions
class ParseError extends Error {
    constructor(message) {
        super(message);
        this.name = "ParseError";
    }
}

class RuntimeError extends Error {
    constructor(token, message) {
        super(message);
        this.name = "RuntimeError";
        this.token = token;
    }
}

// NOUVEAU pour Chapitre 11 : Exception pour return
class ReturnException {
    constructor(value) {
        this.value = value;
    }
}

