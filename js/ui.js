// ui.js — Pont entre l'interface HTML et les trois étages Scanner/Parser/Interpreter
// Dépend de : tous les fichiers ci-dessus
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { StreamLanguage, syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";

const monLangage = StreamLanguage.define({
    token(stream) {
        if (stream.eatSpace()) return null;
        if (stream.match(/^(si|sinon|tant que|pour|dans|de|à|par|fonction|fin|retourner|vrai|faux|et|ou|non)\b/i)) return "keyword";
        if (stream.match(/^\d+(\.\d+)?/)) return "number";
        if (stream.match(/^"[^"]*"/)) return "string";
        stream.next();
        return null;
    }
});

let editorView;
// Fonction pour analyser et interpréter le code
function interpretCode() {
    const resultOutput = document.getElementById('result-output');
    const errorsOutput = document.getElementById('errors-output');
    
    // Réinitialiser les sorties
    resultOutput.innerHTML = '';
    errorsOutput.innerHTML = '';
    
    // Récupérer le code source
    // avant : const sourceCode = document.getElementById('code-input').value;
    const sourceCode = editorView.state.doc.toString();    
    if (!sourceCode.trim()) {
        resultOutput.innerHTML = '<span class="error">Veuillez entrer du code à interpréter.</span>';
        return;
    }
    
    // Étape 1 : Scanner
    const scanner = new Scanner(sourceCode);
    const scanResult = scanner.scanTokens();
    console.log("liste des tokens :");
    console.log(scanResult);
    
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
    console.log("statements est une liste d'objets représentant l'ast :");
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

function indenterNouvelleLigne(view) {
    const { state } = view;
    const pos = state.selection.main.head;
    const line = state.doc.lineAt(pos);
    const texteAvant = line.text.slice(0, pos - line.from).trim();
    const indentActuelle = /^\s*/.exec(line.text)[0];

    // Mots-clés qui ouvrent un bloc dans ta syntaxe
const ouvreUnBloc = /^(si|sinon si|sinon|tant que|pour|fonction)\b/i.test(texteAvant) || /\{\s*$/.test(texteAvant);    const nouvelleIndent = indentActuelle + (ouvreUnBloc ? "    " : "");

    view.dispatch(state.update(
        state.replaceSelection("\n" + nouvelleIndent),
        { scrollIntoView: true }
    ));
    return true;
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    editorView = new EditorView({
        doc: '',
        extensions: [
            lineNumbers(),
            history(),
            monLangage,
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            keymap.of([
                 { key: "Enter", run: indenterNouvelleLigne },
                ...defaultKeymap,
                ...historyKeymap,
                { key: "Ctrl-Enter", run: () => { interpretCode(); return true; } }
            ])
        ],
        parent: document.getElementById('code-input')
    });
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
            // avant : codeInput.value = examples[exampleId];
            editorView.dispatch({
                changes: { from: 0, to: editorView.state.doc.length, insert: examples[exampleId] }
            });
        });
    });
    
});
