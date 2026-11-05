// examples.js — Exemples de pseudo-code français affichés dans l'interface

// Variables globales pour stocker les résultats
let currentStatements = null;
let interpreter = new Interpreter();

// Exemples de code
const examples = {
    "1": `fonction saluer(nom)
    afficher "Bonjour, " + nom + "!";
fin fonction

saluer("Alice");
saluer("Bob");`,
    "2": `fonction additionner(a, b)
    retourner a + b;
fin fonction

variable resultat <- additionner(5, 3);
afficher "5 + 3 = " + resultat;`,
    "3": `fonction factorielle(n)
    si n <= 1 alors
        retourner 1;
    fin si
    retourner n * factorielle(n - 1);
fin fonction

afficher "5! = " + factorielle(5);
afficher "10! = " + factorielle(10);`,
    "4": `fonction creerCompteur()
    variable compte <- 0;
    fonction incrementer()
        compte <- compte + 1;
        retourner compte;
    fin fonction
    retourner incrementer;
fin fonction

variable compteur <- creerCompteur();
afficher compteur();
afficher compteur();
afficher compteur();`,
    "5": `fonction fibonacci(n)
    si n <= 1 alors
        retourner n;
    fin si
    retourner fibonacci(n - 1) + fibonacci(n - 2);
fin fonction

pour i de 0 à 10 faire
    afficher "fib(" + i + ") = " + fibonacci(i);
fin pour`,
    "6": `variable globale <- "Je suis globale";

fonction tester()
    variable locale <- "Je suis locale";
    afficher globale;
    afficher locale;
fin fonction

tester();
afficher globale;`,
    "7": `fonction externe()
    variable x <- "externe";
    
    fonction interne()
        afficher x;
    fin fonction
    
    interne();
fin fonction

externe();`
};

