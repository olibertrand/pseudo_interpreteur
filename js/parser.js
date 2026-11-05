// parser.js — Parser : construit l'AST à partir de la liste de tokens (analyse récursive descendante)
// Dépend de : tokens.js, ast.js, errors.js

// Parser pour le pseudo-code français avec support des fonctions
class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.current = 0;
        this.errors = [];
    }
    
    parse() {
        try {
            const statements = [];
            
            while (!this.isAtEnd()) {
                statements.push(this.declaration());
            }
            
            return statements;
        } catch (error) {
            if (error instanceof ParseError) {
                return null;
            }
            throw error;
        }
    }
    
    declaration() {
        try {
            if (this.match(TokenType.FONCTION)) return this.function("fonction");
            if (this.match(TokenType.VARIABLE)) return this.varDeclaration();
            
            return this.statement();
        } catch (error) {
            console.log("erreur avalée dans declaration():", error.message);
            this.synchronize();
            return null;
        }
    }
    
    // NOUVEAU pour Chapitre 11 : Déclaration de fonction
    function(kind) {
        const name = this.consume(TokenType.IDENTIFIANT, `Attendu un nom de ${kind}.`);
        this.consume(TokenType.PARENTHESE_GAUCHE, `Attendu '(' après le nom de ${kind}.`);
        
        const parameters = [];
        if (!this.check(TokenType.PARENTHESE_DROITE)) {
            do {
                if (parameters.length >= 255) {
                    this.error(this.peek(), "Une fonction ne peut pas avoir plus de 255 paramètres.");
                }
                
                parameters.push(this.consume(TokenType.IDENTIFIANT, "Attendu un nom de paramètre."));
            } while (this.match(TokenType.VIRGULE));
        }
        
        this.consume(TokenType.PARENTHESE_DROITE, "Attendu ')' après les paramètres.");
        
        // Le corps de la fonction
        const body = [];
        while (!this.check(TokenType.FIN) && !this.isAtEnd()) {
            body.push(this.declaration());
        }
        
        this.consume(TokenType.FIN, `Attendu 'fin fonction' après le corps de la ${kind}.`);
        this.consume(TokenType.FONCTION, `Attendu 'fonction' après 'fin'.`);
        
        return new FunctionStmt(name, parameters, body);
    }
    
    varDeclaration() {
        const name = this.consume(TokenType.IDENTIFIANT, "Attendu un nom de variable.");
        
        let initializer = null;
        if (this.match(TokenType.FLECHE)) {
            initializer = this.expression();
        }
        
        if (this.check(TokenType.POINT_VIRGULE)) {
            this.advance();
        }
        
        return new Var(name, initializer);
    }
    
    statement() {
        if (this.match(TokenType.SI)) return this.ifStatement();
        if (this.match(TokenType.TANT_QUE)) return this.whileStatement();
        if (this.match(TokenType.POUR)) return this.forStatement();
        if (this.match(TokenType.AFFICHER)) return this.printStatement();
        if (this.match(TokenType.RETOURNER)) return this.returnStatement();
        if (this.match(TokenType.ACCOLADE_GAUCHE)) return new Block(this.block());
        if (this.match(TokenType.FIN)) {
            return this.statement();
        }
        
        return this.expressionStatement();
    }

    block() {
        const statements = [];
        while (!this.check(TokenType.ACCOLADE_DROITE) && !this.isAtEnd()) {
            statements.push(this.declaration());
        }
        this.consume(TokenType.ACCOLADE_DROITE, "Attendu '}' après le bloc.");
        return statements;
    }
    
    ifStatement() {
        const condition = this.expression();
        //this.consume(TokenType.ALORS, "Attendu 'alors' après la condition.");
        // Le ALORS est optionnel. On peut aussi mettre (ou pas) ':'
        this.match(TokenType.ALORS);
        this.match(TokenType.DEUX_POINTS);
        
        // On met après le 'si' une seule instruction ou un  bloc
        let thenBranch = null;
        if (this.match(TokenType.ACCOLADE_GAUCHE)) {
            thenBranch = this.block();
        } else {
            thenBranch = [this.declaration()];
        }
        
        let elseBranch = null;
        if (this.match(TokenType.SINON)) {
            if (this.match(TokenType.ACCOLADE_GAUCHE)) {
                elseBranch = this.block();
            } else {
                elseBranch = [this.declaration()];
            }
        }


        return new If(condition, new Block(thenBranch), elseBranch ? new Block(elseBranch) : null);
    }
    
    whileStatement() {
        const condition = this.expression();
        //this.consume(TokenType.FAIRE, "Attendu 'faire' après la condition.");
        this.match(TokenType.FAIRE);
        this.match(TokenType.DEUX_POINTS);
        let body;
        
        if (this.match(TokenType.ACCOLADE_GAUCHE)) {
            body = this.block();
        } else {
            body = [this.declaration()];
        }
        
        return new While(condition, new Block(body));
    }
    
    forStatement() {
        //console.log("forStatement: token courant:", this.peek());
        this.match(TokenType.CHAQUE);
        this.match(TokenType.ELEMENT);
        const variable = this.consume(TokenType.IDENTIFIANT, "Attendu un nom de variable pour la boucle.");
        this.match(TokenType.ALLANT);
        
        if (this.match(TokenType.DANS)) return this.forEachBody(variable);

        this.consume(TokenType.DE, "Attendu 'de' après le nom de variable.");
        
        const start = this.expression();
        this.consume(TokenType.A, "Attendu 'à' après la valeur de début.");
        
        const end = this.expression();

        let step = null;
        if (this.match(TokenType.PAR)) {
            step = this.expression();
        }
        //console.log("4 - après PAR:", this.peek());
        //this.consume(TokenType.FAIRE, "Attendu 'faire' après la valeur de fin.");
        this.match(TokenType.FAIRE);
        this.match(TokenType.DEUX_POINTS);

        
        let body;
        
        if (this.match(TokenType.ACCOLADE_GAUCHE)) {
            body = this.block();
        } else {
            body = [this.declaration()];
        }
        //console.log("avant return:", variable, start, end, body);
        return new For(variable, start, end, step, new Block(body));
    }
    
    forEachBody(variable) {
        const iterable = this.expression();
        this.match(TokenType.FAIRE);
        this.match(TokenType.DEUX_POINTS);

        let body;
        if (this.match(TokenType.ACCOLADE_GAUCHE)) {
            body = this.block();
        } else {
            body = [this.declaration()];
        }

        return new ForEach(variable, iterable, new Block(body));
    }
    
    printStatement() {
        const value = this.expression();
        
        if (this.check(TokenType.POINT_VIRGULE)) {
            this.advance();
        }
        
        return new Print(value);
    }
    
    // NOUVEAU pour Chapitre 11 : Return statement
    returnStatement() {
        const keyword = this.previous();
        let value = null;
        
        if (!this.check(TokenType.POINT_VIRGULE) && !this.check(TokenType.FIN)) {
            value = this.expression();
        }
        
        if (this.check(TokenType.POINT_VIRGULE)) {
            this.advance();
        }
        
        return new Return(keyword, value);
    }
    
    expressionStatement() {
        const expr = this.expression();
        
        if (this.check(TokenType.POINT_VIRGULE)) {
            this.advance();
        }
        
        return new Expression(expr);
    }
    
    expression() {
        return this.assignment();
    }
    
    assignment() {
        const expr = this.logicalOr();
        
        if (this.match(TokenType.FLECHE)) {
            const value = this.assignment();
            
            if (expr instanceof Variable) {
                const name = expr.name;
                return new Assign(name, value);
            }
            
            this.error(this.previous(), "Cible d'affectation invalide.");
        }
        
        return expr;
    }
    
    logicalOr() {
        let expr = this.logicalAnd();
        
        while (this.match(TokenType.OU)) {
            const operator = this.previous();
            const right = this.logicalAnd();
            expr = new Logical(expr, operator, right);
        }
        
        return expr;
    }
    
    logicalAnd() {
        let expr = this.equality();
        
        while (this.match(TokenType.ET)) {
            const operator = this.previous();
            const right = this.equality();
            expr = new Logical(expr, operator, right);
        }
        
        return expr;
    }
    
    equality() {
        let expr = this.comparison();
        
        while (this.match(TokenType.NON_EGAL, TokenType.EGAL_EGAL)) {
            const operator = this.previous();
            const right = this.comparison();
            expr = new Binary(expr, operator, right);
        }
        
        return expr;
    }
    
    comparison() {
        let expr = this.term();
        
        while (this.match(TokenType.SUPERIEUR, TokenType.SUPERIEUR_EGAL, TokenType.INFERIEUR, TokenType.INFERIEUR_EGAL)) {
            const operator = this.previous();
            const right = this.term();
            expr = new Binary(expr, operator, right);
        }
        
        return expr;
    }
    
    term() {
        let expr = this.factor();
        
        while (this.match(TokenType.MOINS, TokenType.PLUS)) {
            const operator = this.previous();
            const right = this.factor();
            expr = new Binary(expr, operator, right);
        }
        
        return expr;
    }
    
    factor() {
        let expr = this.unary();
        
        while (this.match(TokenType.SLASH, TokenType.ETOILE, TokenType.MOD)) {
            const operator = this.previous();
            const right = this.unary();
            expr = new Binary(expr, operator, right);
        }
        
        return expr;
    }
    
    unary() {
        if (this.match(TokenType.NON, TokenType.MOINS)) {
            const operator = this.previous();
            const right = this.unary();
            return new Unary(operator, right);
        }
        
        return this.call();
    }
    
    // NOUVEAU pour Chapitre 11 : Call expression
    call() {
        let expr = this.index();
        while (true) {
            if (this.match(TokenType.PARENTHESE_GAUCHE)) {
                expr = this.finishCall(expr);
            } else {
                break;
            }
        }
        return expr;
    }

    // Pour accéder aux éléments d'une liste
    index() {
        let expr = this.primary();
        while (this.match(TokenType.CROCHET_GAUCHE)) {
            const crochet = this.previous();
            const indice = this.expression();
            this.consume(TokenType.CROCHET_DROIT, "']' attendu.");
            expr = new AccesListe(expr, crochet, indice);
        }
        return expr;
    }
    
    finishCall(callee) {
        const args = [];
        
        if (!this.check(TokenType.PARENTHESE_DROITE)) {
            do {
                if (args.length >= 255) {
                    this.error(this.peek(), "Un appel ne peut pas avoir plus de 255 arguments.");
                }
                args.push(this.expression());
            } while (this.match(TokenType.VIRGULE));
        }
        
        const paren = this.consume(TokenType.PARENTHESE_DROITE, "Attendu ')' après les arguments.");
        
        return new Call(callee, paren, args);
    }
    
    primary() {
        if (this.match(TokenType.FAUX)) return new Literal(false);
        if (this.match(TokenType.VRAI)) return new Literal(true);
        if (this.match(TokenType.NUL)) return new Literal(null);

        if (this.match(TokenType.CROCHET_GAUCHE)) {
            const elements = [];
            if (!this.check(TokenType.CROCHET_DROIT)) {
                do { elements.push(this.expression()); }
                while (this.match(TokenType.VIRGULE));
            }
            this.consume(TokenType.CROCHET_DROIT, "']' attendu.");
            return new ListeLitterale(elements);
        }

        if (this.match(TokenType.ACCOLADE_GAUCHE)) {
            const paires = [];
            if (!this.check(TokenType.ACCOLADE_DROITE)) {
                do {
                    const cle = this.expression();
                    this.consume(TokenType.DEUX_POINTS, "':' attendu après la clé.");
                    const valeur = this.expression();
                    paires.push({ cle, valeur });
                } while (this.match(TokenType.VIRGULE));
            }
            this.consume(TokenType.ACCOLADE_DROITE, "'}' attendu.");
            return new DictLitteral(paires);
        }
        
        if (this.match(TokenType.NOMBRE, TokenType.CHAINE)) {
            return new Literal(this.previous().literal);
        }
        
        if (this.match(TokenType.IDENTIFIANT)) {
            return new Variable(this.previous());
        }
        
        if (this.match(TokenType.PARENTHESE_GAUCHE)) {
            const expr = this.expression();
            this.consume(TokenType.PARENTHESE_DROITE, "Attendu ')' après l'expression.");
            return new Grouping(expr);
        }
        
        throw this.error(this.peek(), "Expression attendue.");
    }
    
    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        
        return false;
    }
    
    consume(type, message) {
        if (this.check(type)) return this.advance();
        
        throw this.error(this.peek(), message);
    }
    
    check(type) {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }
    
    advance() {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }
    
    isAtEnd() {
        return this.peek().type === TokenType.EOF;
    }
    
    peek() {
        return this.tokens[this.current];
    }
    
    previous() {
        return this.tokens[this.current - 1];
    }
    
    error(token, message) {
        let errorMessage;
        if (token.type === TokenType.EOF) {
            errorMessage = `Ligne ${token.line} à la fin: ${message}`;
        } else {
            errorMessage = `Ligne ${token.line} à '${token.lexeme}': ${message}`;
        }
        
        this.errors.push(errorMessage);
        
        return new ParseError(errorMessage);
    }
    
    synchronize() {
        this.advance();
        
        while (!this.isAtEnd()) {
            if (this.previous().type === TokenType.POINT_VIRGULE) return;
            
            switch (this.peek().type) {
                case TokenType.FONCTION:
                case TokenType.VARIABLE:
                case TokenType.POUR:
                case TokenType.SI:
                case TokenType.TANT_QUE:
                case TokenType.AFFICHER:
                case TokenType.RETOURNER:
                    return;
            }
            
            this.advance();
        }
    }
}

