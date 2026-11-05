// scanner.js — Scanner : transforme le texte source en une liste de tokens
// Dépend de : tokens.js (TokenType, Token)

// Classe Scanner pour le pseudo-code français
class Scanner {
    constructor(source) {
        this.source = source;
        this.tokens = [];
        this.start = 0;
        this.current = 0;
        this.line = 1;
        this.errors = [];
        
        this.keywords = {
            'et': TokenType.ET,
            'classe': TokenType.CLASSE,
            'sinon': TokenType.SINON,
            'faux': TokenType.FAUX,
            'fonction': TokenType.FONCTION,
            'pour': TokenType.POUR,
            'si': TokenType.SI,
            'nul': TokenType.NUL,
            'ou': TokenType.OU,
            'afficher': TokenType.AFFICHER,
            'retourner': TokenType.RETOURNER,
            'super': TokenType.SUPER,
            'ceci': TokenType.CECI,
            'vrai': TokenType.VRAI,
            'variable': TokenType.VARIABLE,
//                    'tant': TokenType.TANT_QUE,
            'faire': TokenType.FAIRE,
            'fin': TokenType.FIN,
            'alors': TokenType.ALORS,
            'de': TokenType.DE,
            'à': TokenType.A,
            'mod': TokenType.MOD,
            'non': TokenType.NON
        };
    }
    
    scanTokens() {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }
        
        this.tokens.push(new Token(TokenType.EOF, "", null, this.line));
        return { tokens: this.tokens, errors: this.errors };
    }
    
    scanToken() {
        const c = this.advance();
        
        switch (c) {
            case '(': this.addToken(TokenType.PARENTHESE_GAUCHE); break;
            case ')': this.addToken(TokenType.PARENTHESE_DROITE); break;
            case '{': this.addToken(TokenType.ACCOLADE_GAUCHE); break;
            case '}': this.addToken(TokenType.ACCOLADE_DROITE); break;
            case '[': this.addToken(TokenType.CROCHET_GAUCHE); break;
            case ']': this.addToken(TokenType.CROCHET_DROIT); break;
            case ',': this.addToken(TokenType.VIRGULE); break;
            case '.': this.addToken(TokenType.POINT); break;
            case '-': 
                if (this.match('>')) {
                    this.addToken(TokenType.FLECHE);
                } else {
                    this.addToken(TokenType.MOINS);
                }
                break;
            case '+': this.addToken(TokenType.PLUS); break;
            case ';': this.addToken(TokenType.POINT_VIRGULE); break;
            case '*': this.addToken(TokenType.ETOILE); break;
            
            case '!': 
                this.addToken(this.match('=') ? TokenType.NON_EGAL : TokenType.NON);
                break;
            case '=':
                this.addToken(this.match('=') ? TokenType.EGAL_EGAL : TokenType.EGAL);
                break;
            case '<':
                if (this.match('-')) {
                    this.addToken(TokenType.FLECHE);
                } else {
                    this.addToken(this.match('=') ? TokenType.INFERIEUR_EGAL : TokenType.INFERIEUR);
                }
                break;
            case '>':
                this.addToken(this.match('=') ? TokenType.SUPERIEUR_EGAL : TokenType.SUPERIEUR);
                break;
            
            case '/':
                if (this.match('/')) {
                    while (this.peek() !== '\n' && !this.isAtEnd()) {
                        this.advance();
                    }
                } else if (this.match('*')) {
                    this.multilineComment();
                } else {
                    this.addToken(TokenType.SLASH);
                }
                break;
            
            case ' ':
            case '\r':
            case '\t':
                break;
            
            case '\n':
                this.line++;
                break;
            
            case '"': this.string(); break;
            
            default:
                if (this.isDigit(c)) {
                    this.number();
                } else if (this.isAlpha(c)) {
                    this.identifier();
                } else {
                    this.errors.push(`Erreur ligne ${this.line}: Caractère inattendu '${c}'`);
                }
                break;
        }
    }
    
    multilineComment() {
        while (!this.isAtEnd()) {
            if (this.peek() === '*' && this.peekNext() === '/') {
                this.advance();
                this.advance();
                return;
            }
            
            if (this.peek() === '\n') this.line++;
            this.advance();
        }
        
        this.errors.push(`Erreur ligne ${this.line}: Commentaire multi-lignes non fermé`);
    }
    
    identifier() {
        while (this.isAlphaNumeric(this.peek())) {
            this.advance();
        }
        
        let text = this.source.substring(this.start, this.current);
        
        // Traitement spécial pour "tant que"
        if (text.toLowerCase() === "tant" && this.peek() === ' ') {
            const savedCurrent = this.current;
            this.advance();
            
            let tempStart = this.current;
            while (this.isAlpha(this.peek())) {
                this.advance();
            }
            
            const nextWord = this.source.substring(tempStart, this.current);
            if (nextWord.toLowerCase() === "que") {
                this.addToken(TokenType.TANT_QUE);
                return;
            } else {
                this.current = savedCurrent;
            }
        }
        
        let type = this.keywords[text.toLowerCase()];
        if (type === undefined) type = TokenType.IDENTIFIANT;
        
        this.addToken(type);
    }
    
    number() {
        while (this.isDigit(this.peek())) {
            this.advance();
        }
        
        if (this.peek() === ',' && this.isDigit(this.peekNext())) {
            this.advance();
            while (this.isDigit(this.peek())) {
                this.advance();
            }
        }
        
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            this.advance();
            while (this.isDigit(this.peek())) {
                this.advance();
            }
        }
        
        let numStr = this.source.substring(this.start, this.current);
        numStr = numStr.replace(',', '.');
        this.addToken(TokenType.NOMBRE, parseFloat(numStr));
    }
    
    string() {
        while (this.peek() !== '"' && !this.isAtEnd()) {
            if (this.peek() === '\n') this.line++;
            this.advance();
        }
        
        if (this.isAtEnd()) {
            this.errors.push(`Erreur ligne ${this.line}: Chaîne non terminée`);
            return;
        }
        
        this.advance();
        
        const value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken(TokenType.CHAINE, value);
    }
    
    match(expected) {
        if (this.isAtEnd()) return false;
        if (this.source.charAt(this.current) !== expected) return false;
        
        this.current++;
        return true;
    }
    
    peek() {
        if (this.isAtEnd()) return '\0';
        return this.source.charAt(this.current);
    }
    
    peekNext() {
        if (this.current + 1 >= this.source.length) return '\0';
        return this.source.charAt(this.current + 1);
    }
    
    isAlpha(c) {
        return (c >= 'a' && c <= 'z') ||
               (c >= 'A' && c <= 'Z') ||
               c === '_' ||
               c === 'é' || c === 'è' || c === 'ê' || c === 'ë' ||
               c === 'à' || c === 'â' || c === 'ä' ||
               c === 'ù' || c === 'û' || c === 'ü' ||
               c === 'ô' || c === 'ö' ||
               c === 'î' || c === 'ï' ||
               c === 'ç' ||
               c === 'É' || c === 'È' || c === 'Ê' || c === 'Ë' ||
               c === 'À' || c === 'Â' || c === 'Ä' ||
               c === 'Ù' || c === 'Û' || c === 'Ü' ||
               c === 'Ô' || c === 'Ö' ||
               c === 'Î' || c === 'Ï' ||
               c === 'Ç';
    }
    
    isAlphaNumeric(c) {
        return this.isAlpha(c) || this.isDigit(c);
    }
    
    isDigit(c) {
        return c >= '0' && c <= '9';
    }
    
    advance() {
        return this.source.charAt(this.current++);
    }
    
    addToken(type, literal = null) {
        const text = this.source.substring(this.start, this.current);
        this.tokens.push(new Token(type, text, literal, this.line));
    }
    
    isAtEnd() {
        return this.current >= this.source.length;
    }
}

