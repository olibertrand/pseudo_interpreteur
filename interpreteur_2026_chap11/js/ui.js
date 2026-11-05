// ui.js — Pont entre l'interface HTML et les trois étages Scanner/Parser/Interpreter
// Dépend de : tous les fichiers ci-dessus

// Fonction pour analyser et interpréter le code
function interpretCode() {
    const resultOutput = document.getElementById('result-output');
    const errorsOutput = document.getElementById('errors-output');
    
    // Réinitialiser les sorties
    resultOutput.innerHTML = '';
    errorsOutput.innerHTML = '';
    
    // Récupérer le code source
    const sourceCode = document.getElementById('code-input').value;
    
    if (!sourceCode.trim()) {
        resultOutput.innerHTML = '<span class="error">Veuillez entrer du code à interpréter.</span>';
        return;
    }
    
    // Étape 1 : Scanner
    const scanner = new Scanner(sourceCode);
    const scanResult = scanner.scanTokens();
    
    // Afficher les erreurs du scanner
    if (scanResult.errors.length > 0) {
        scanResult.errors.forEach(error => {
            errorsOutput.innerHTML += `<span class="error">${error}</span><br>`;
        });
        currentStatements = null;
        return;
    }
    
    // Étape 2 : Parser
    const parser = new Parser(scanResult.tokens);
    const statements = parser.parse();
    console.log("statements est une liste d'objets représentant l'ast");
    console.log(statements);
    currentStatements = statements;
    
    // Afficher les erreurs du parser
    if (parser.errors.length > 0) {
        parser.errors.forEach(error => {
            errorsOutput.innerHTML += `<span class="error">${error}</span><br>`;
        });
        currentStatements = null;
        return;
    }
    
    if (!statements) {
        errorsOutput.innerHTML = '<span class="error">Impossible d\'analyser le code en raison d\'erreurs syntaxiques.</span>';
        return;
    }
    
    // Étape 3 : Interpréter
    // Réinitialiser l'interpréteur pour chaque exécution
    interpreter = new Interpreter();
    
    const interpretResult = interpreter.interpret(statements);
    
    // Afficher les erreurs d'exécution
    if (interpretResult.errors.length > 0) {
        interpretResult.errors.forEach(error => {
            errorsOutput.innerHTML += `<div class="runtime-error">${error}</div>`;
        });
    }
    
    // Si aucune sortie n'a été générée, afficher un message de succès
    if (resultOutput.innerHTML === '' && interpretResult.errors.length === 0) {
        resultOutput.innerHTML = '<div class="success">Programme exécuté avec succès (aucune sortie).</div>';
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    const codeInput = document.getElementById('code-input');
    const resultOutput = document.getElementById('result-output');
    const errorsOutput = document.getElementById('errors-output');
    const interpretBtn = document.getElementById('interpret-btn');
    const outputTabs = document.querySelectorAll('.output-tab');
    const exampleBtns = document.querySelectorAll('.use-example-btn');
    
    // Gestionnaire d'événements pour les onglets de sortie
    outputTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            outputTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            resultOutput.classList.remove('output-visible');
            errorsOutput.classList.remove('output-visible');
            
            const targetId = tab.getAttribute('data-target');
            document.getElementById(targetId).classList.add('output-visible');
        });
    });
    
    // Gestionnaire d'événements pour le bouton d'interprétation
    interpretBtn.addEventListener('click', () => {
        console.log("intérprétation du code");
        interpretCode();
    });
    
    // Gestionnaire d'événements pour les boutons d'exemple
    exampleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const exampleId = btn.getAttribute('data-example');
            codeInput.value = examples[exampleId];
            // Les boutons sont loin sous la zone de texte : sans ce défilement, le code est
            // bien chargé mais hors de l'écran, et le clic semble ne rien faire.
            document.querySelector('.editor-container').scrollIntoView({ behavior: 'smooth' });
            codeInput.focus({ preventScroll: true });
        });
    });
    
    // Raccourci clavier pour interpréter (Ctrl+Enter)
    codeInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            interpretCode();
        }
    });
});
