// interpreter.js — Interpreter : exécute l'AST (patron Visiteur)
// Dépend de : tokens.js, environment.js, callable.js, errors.js

// Interpréteur pour pseudo-code français avec support des fonctions
class Interpreter {
    constructor() {
        this.globals = new Environment();
        this.environment = this.globals;
        this.runtimeErrors = [];
        
        // Définir la fonction native horloge
        this.globals.define("horloge", new ClockNative());
    }
    
    interpret(statements) {
        this.runtimeErrors = [];
        const results = [];
        
        try {
            for (const statement of statements) {
                if (statement) {
                    this.execute(statement);
                }
            }
            return { results: this.runtimeErrors.length === 0 ? ["Exécution terminée avec succès."] : [], errors: this.runtimeErrors };
        } catch (error) {
            if (error instanceof RuntimeError) {
                this.runtimeErrors.push(`Erreur d'exécution ligne ${error.token.line}: ${error.message}`);
                return { results: [], errors: this.runtimeErrors };
            }
            throw error;
        }
    }
    
    execute(stmt) {
        return stmt.accept(this);
    }
    
    // NOUVEAU pour Chapitre 11 : executeBlock pour gérer les portées
    executeBlock(statements, environment) {
        const previous = this.environment;
        try {
            this.environment = environment;
            
            for (const statement of statements) {
                if (statement) {
                    this.execute(statement);
                }
            }
        } finally {
            this.environment = previous;
        }
    }
    
    evaluate(expr) {
        return expr.accept(this);
    }
    
    // Visiteurs pour les statements
    visitExpressionStmt(stmt) {
        this.evaluate(stmt.expression);
        return null;
    }
    
    visitPrintStmt(stmt) {
        const value = this.evaluate(stmt.expression);
        console.log(this.stringify(value));
        // Afficher dans l'interface
        const resultOutput = document.getElementById('result-output');
        if (resultOutput) {
            const div = document.createElement('div');
            div.textContent = this.stringify(value);
            resultOutput.appendChild(div);
        }
        return null;
    }
    
    visitVarStmt(stmt) {
        let value = null;
        if (stmt.initializer !== null) {
            value = this.evaluate(stmt.initializer);
        }
        
        this.environment.define(stmt.name.lexeme, value);
        return null;
    }
    
    visitBlockStmt(stmt) {
        this.executeBlock(stmt.statements, new Environment(this.environment));
        return null;
    }
    
    visitIfStmt(stmt) {
        if (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.thenBranch);
        } else if (stmt.elseBranch !== null) {
            this.execute(stmt.elseBranch);
        }
        return null;
    }
    
    visitWhileStmt(stmt) {
        while (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.body);
        }
        return null;
    }
    
    visitForStmt(stmt) {
        const start = this.evaluate(stmt.start);
        const end = this.evaluate(stmt.end);
        
        if (typeof start !== 'number' || typeof end !== 'number') {
            throw new RuntimeError(stmt.variable, "Les bornes de la boucle doivent être des nombres.");
        }
        
        // Créer un nouvel environnement pour la variable de boucle
        const forEnv = new Environment(this.environment);
        const previous = this.environment;
        
        try {
            this.environment = forEnv;
            
            for (let i = start; i <= end; i++) {
                this.environment.define(stmt.variable.lexeme, i);
                this.execute(stmt.body);
            }
        } finally {
            this.environment = previous;
        }
        
        return null;
    }
    
    // NOUVEAU pour Chapitre 11 : Déclaration de fonction
    visitFunctionStmt(stmt) {
        // Créer la fonction en capturant l'environnement actuel (closure)
        const func = new LoxFunction(stmt, this.environment);
        this.environment.define(stmt.name.lexeme, func);
        return null;
    }
    
    // NOUVEAU pour Chapitre 11 : Return statement
    visitReturnStmt(stmt) {
        let value = null;
        if (stmt.value !== null) {
            value = this.evaluate(stmt.value);
        }
        
        throw new ReturnException(value);
    }
    
    // Visiteurs pour les expressions
    visitLiteralExpr(expr) {
        return expr.value;
    }
    
    visitGroupingExpr(expr) {
        return this.evaluate(expr.expression);
    }
    
    visitVariableExpr(expr) {
        return this.environment.get(expr.name);
    }
    
    visitAssignExpr(expr) {
        const value = this.evaluate(expr.value);
        this.environment.assign(expr.name, value);
        return value;
    }
    
    visitUnaryExpr(expr) {
        const right = this.evaluate(expr.right);
        
        switch (expr.operator.type) {
            case TokenType.MOINS:
                this.checkNumberOperand(expr.operator, right);
                return -right;
            case TokenType.NON:
                return !this.isTruthy(right);
        }
        
        return null;
    }
    
    visitBinaryExpr(expr) {
        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right);
        
        switch (expr.operator.type) {
            case TokenType.SUPERIEUR:
                this.checkNumberOperands(expr.operator, left, right);
                return left > right;
            case TokenType.SUPERIEUR_EGAL:
                this.checkNumberOperands(expr.operator, left, right);
                return left >= right;
            case TokenType.INFERIEUR:
                this.checkNumberOperands(expr.operator, left, right);
                return left < right;
            case TokenType.INFERIEUR_EGAL:
                this.checkNumberOperands(expr.operator, left, right);
                return left <= right;
            case TokenType.NON_EGAL:
                return !this.isEqual(left, right);
            case TokenType.EGAL_EGAL:
                return this.isEqual(left, right);
            case TokenType.MOINS:
                this.checkNumberOperands(expr.operator, left, right);
                return left - right;
            case TokenType.PLUS:
                if (typeof left === 'number' && typeof right === 'number') {
                    return left + right;
                }
                
                if (typeof left === 'string' && typeof right === 'string') {
                    return left + right;
                }
                
                if (typeof left === 'string' || typeof right === 'string') {
                    return this.stringify(left) + this.stringify(right);
                }
                
                throw new RuntimeError(expr.operator, 
                    "Les opérandes doivent être deux nombres ou deux chaînes.");
            case TokenType.SLASH:
                this.checkNumberOperands(expr.operator, left, right);
                if (right === 0) {
                    throw new RuntimeError(expr.operator, "Division par zéro.");
                }
                return left / right;
            case TokenType.ETOILE:
                this.checkNumberOperands(expr.operator, left, right);
                return left * right;
            case TokenType.MOD:
                this.checkNumberOperands(expr.operator, left, right);
                if (right === 0) {
                    throw new RuntimeError(expr.operator, "Modulo par zéro.");
                }
                return left % right;
        }
        
        return null;
    }
    
    visitLogicalExpr(expr) {
        const left = this.evaluate(expr.left);
        
        if (expr.operator.type === TokenType.OU) {
            if (this.isTruthy(left)) return left;
        } else {
            if (!this.isTruthy(left)) return left;
        }
        
        return this.evaluate(expr.right);
    }
    
    // NOUVEAU pour Chapitre 11 : Appel de fonction
    visitCallExpr(expr) {
        const callee = this.evaluate(expr.callee);
        
        const args = [];
        for (const argument of expr.args) {
            args.push(this.evaluate(argument));
        }
        
        if (!(callee instanceof LoxCallable)) {
            throw new RuntimeError(expr.paren, "Seules les fonctions peuvent être appelées.");
        }
        
        const func = callee;
        
        if (args.length !== func.arity()) {
            throw new RuntimeError(expr.paren, 
                `Attendu ${func.arity()} arguments mais ${args.length} fournis.`);
        }
        
        return func.call(this, args);
    }
    
    // Méthodes utilitaires
    isTruthy(object) {
        if (object === null) return false;
        if (typeof object === 'boolean') return object;
        return true;
    }
    
    isEqual(a, b) {
        return a === b;
    }
    
    checkNumberOperand(operator, operand) {
        if (typeof operand === 'number') return;
        throw new RuntimeError(operator, "L'opérande doit être un nombre.");
    }
    
    checkNumberOperands(operator, left, right) {
        if (typeof left === 'number' && typeof right === 'number') return;
        throw new RuntimeError(operator, "Les opérandes doivent être des nombres.");
    }
    
    stringify(object) {
        if (object === null) return "nul";
        
        if (typeof object === 'number') {
            let text = object.toString();
            if (text.endsWith(".0")) {
                text = text.substring(0, text.length - 2);
            }
            return text;
        }
        
        if (typeof object === 'boolean') {
            return object ? "vrai" : "faux";
        }
        
        if (typeof object === 'string') return object;
        
        if (object instanceof LoxFunction) {
            return object.toString();
        }
        
        return object.toString();
    }
}

