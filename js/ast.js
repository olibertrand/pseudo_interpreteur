// ast.js — Classes de l'arbre syntaxique (AST) : expressions (Expr) et instructions (Stmt)
// Utilisé par : parser.js (construction), interpreter.js (exécution via visitXxx)

// Classes d'expressions pour l'AST
class Expr {
    accept(visitor) {}
}

class Binary extends Expr {
    constructor(left, operator, right) {
        super();
        this.left = left;
        this.operator = operator;
        this.right = right;
    }
    
    accept(visitor) {
        return visitor.visitBinaryExpr(this);
    }
}

class Grouping extends Expr {
    constructor(expression) {
        super();
        this.expression = expression;
    }
    
    accept(visitor) {
        return visitor.visitGroupingExpr(this);
    }
}

class Literal extends Expr {
    constructor(value) {
        super();
        this.value = value;
    }
    
    accept(visitor) {
        return visitor.visitLiteralExpr(this);
    }
}

class Unary extends Expr {
    constructor(operator, right) {
        super();
        this.operator = operator;
        this.right = right;
    }
    
    accept(visitor) {
        return visitor.visitUnaryExpr(this);
    }
}

class Logical extends Expr {
    constructor(left, operator, right) {
        super();
        this.left = left;
        this.operator = operator;
        this.right = right;
    }
    
    accept(visitor) {
        return visitor.visitLogicalExpr(this);
    }
}

class Variable extends Expr {
    constructor(name) {
        super();
        this.name = name;
    }
    
    accept(visitor) {
        return visitor.visitVariableExpr(this);
    }
}

class Assign extends Expr {
    constructor(name, value) {
        super();
        this.name = name;
        this.value = value;
    }
    
    accept(visitor) {
        return visitor.visitAssignExpr(this);
    }
}

// NOUVEAU pour Chapitre 11 : Call expression (appel de fonction)
class Call extends Expr {
    constructor(callee, paren, args) {
        super();
        this.callee = callee;
        this.paren = paren;
        this.args = args;
    }
    
    accept(visitor) {
        return visitor.visitCallExpr(this);
    }
}

class ListeLitterale extends Expr {
    constructor(elements) {
        super();
        this.elements = elements; // tableau d'Expr
    }

    accept(visitor) {
        return visitor.visitListeLiteraleExpr(this);
    }
}

class AccesListe extends Expr {
    constructor(liste, crochet, indice) {
        super();
        this.liste = liste;       // Expr (la liste)
        this.crochet = crochet;   // Token '[' (permet de localiser la ligne pour les erreurs)
        this.indice = indice;     // Expr (l'indice)
    }
    accept(visitor) { return visitor.visitAccesListeExpr(this); }
}

class DictLitteral extends Expr {
    constructor(paires) {
        super();
        this.paires = paires; // tableau de {cle: Expr, valeur: Expr}
    }
    accept(visitor) { return visitor.visitDictLitteralExpr(this); }
}

// Classes de déclarations (statements)
class Stmt {
    accept(visitor) {}
}

class Expression extends Stmt {
    constructor(expression) {
        super();
        this.expression = expression;
    }
    
    accept(visitor) {
        return visitor.visitExpressionStmt(this);
    }
}

class Print extends Stmt {
    constructor(expression) {
        super();
        this.expression = expression;
    }
    
    accept(visitor) {
        return visitor.visitPrintStmt(this);
    }
}

class Var extends Stmt {
    constructor(name, initializer) {
        super();
        this.name = name;
        this.initializer = initializer;
    }
    
    accept(visitor) {
        return visitor.visitVarStmt(this);
    }
}

class Block extends Stmt {
    constructor(statements) {
        super();
        this.statements = statements;
    }
    
    accept(visitor) {
        return visitor.visitBlockStmt(this);
    }
}

class If extends Stmt {
    constructor(condition, thenBranch, elseBranch) {
        super();
        this.condition = condition;
        this.thenBranch = thenBranch;
        this.elseBranch = elseBranch;
    }
    
    accept(visitor) {
        return visitor.visitIfStmt(this);
    }
}

class While extends Stmt {
    constructor(condition, body) {
        super();
        this.condition = condition;
        this.body = body;
    }
    
    accept(visitor) {
        return visitor.visitWhileStmt(this);
    }
}

class For extends Stmt {
    constructor(variable, start, end, step, body) {
        super();
        this.variable = variable;
        this.start = start;
        this.end = end;
        this.step = step; 
        this.body = body;
    }
    
    accept(visitor) {
        return visitor.visitForStmt(this);
    }
}

class ForEach extends Stmt{
    constructor(variable, iterable, body) {
        super();
        this.variable = variable;   // Token (nom de la variable)
        this.iterable = iterable;   // Expr (ex: ListeLitterale)
        this.body = body;           // tableau de statements (ou statement unique)
    }
    
    accept(visitor) { 
        return visitor.visitForEachStmt(this); 
    }
}

// NOUVEAU pour Chapitre 11 : Function statement
class FunctionStmt extends Stmt {
    constructor(name, params, body) {
        super();
        this.name = name;
        this.params = params;
        this.body = body;
    }
    
    accept(visitor) {
        return visitor.visitFunctionStmt(this);
    }
}

// NOUVEAU pour Chapitre 11 : Return statement
class Return extends Stmt {
    constructor(keyword, value) {
        super();
        this.keyword = keyword;
        this.value = value;
    }
    
    accept(visitor) {
        return visitor.visitReturnStmt(this);
    }
}

