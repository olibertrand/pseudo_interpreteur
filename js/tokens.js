// tokens.js — Définition des types de tokens (TokenType) et de la classe Token
// Utilisé par : scanner.js (production des tokens), parser.js (lecture des tokens)

const TokenType = {
    // Tokens d'un seul caractère
    PARENTHESE_GAUCHE: 'PARENTHESE_GAUCHE',
    PARENTHESE_DROITE: 'PARENTHESE_DROITE',
    ACCOLADE_GAUCHE: 'ACCOLADE_GAUCHE',
    ACCOLADE_DROITE: 'ACCOLADE_DROITE',
    CROCHET_GAUCHE: 'CROCHET_GAUCHE',
    CROCHET_DROIT: 'CROCHET_DROIT',
    VIRGULE: 'VIRGULE',
    POINT: 'POINT',
    DEUX_POINTS: 'DEUX_POINTS',
    MOINS: 'MOINS',
    PLUS: 'PLUS',
    POINT_VIRGULE: 'POINT_VIRGULE',
    SLASH: 'SLASH',
    ETOILE: 'ETOILE',
    FLECHE: 'FLECHE',
    
    // Tokens d'un ou deux caractères
    NON: 'NON',
    NON_EGAL: 'NON_EGAL',
    EGAL: 'EGAL',
    EGAL_EGAL: 'EGAL_EGAL',
    SUPERIEUR: 'SUPERIEUR',
    SUPERIEUR_EGAL: 'SUPERIEUR_EGAL',
    INFERIEUR: 'INFERIEUR',
    INFERIEUR_EGAL: 'INFERIEUR_EGAL',
    MOD: 'MOD',
    
    // Littéraux
    IDENTIFIANT: 'IDENTIFIANT',
    CHAINE: 'CHAINE',
    NOMBRE: 'NOMBRE',
    
    // Mots-clés en français
    ET: 'ET',
    CLASSE: 'CLASSE',
    SINON: 'SINON',
    FAUX: 'FAUX',
    FONCTION: 'FONCTION',
    POUR: 'POUR',
    SI: 'SI',
    NUL: 'NUL',
    OU: 'OU',
    AFFICHER: 'AFFICHER',
    RETOURNER: 'RETOURNER',
    SUPER: 'SUPER',
    CECI: 'CECI',
    VRAI: 'VRAI',
    VARIABLE: 'VARIABLE',
    TANT_QUE: 'TANT_QUE',
    FAIRE: 'FAIRE',
    FIN: 'FIN',
    ALORS: 'ALORS',
    DE: 'DE',
    A: 'A',
    CHAQUE: 'CHAQUE',
    ELEMENT: 'ELEMENT',
    ALLANT: 'ALLANT',
    DANS: 'DANS',
    PAR: 'PAR',
    EOF: 'EOF'
};

class Token {
    constructor(type, lexeme, literal, line) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.line = line;
    }
    
    toString() {
        return `${this.type} ${this.lexeme} ${this.literal !== null ? this.literal : 'null'}`;
    }
}

