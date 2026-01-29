// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyAqE58H0UriOexZpsDAODfNFSsi5Co4nac",
    authDomain: "churrasco-com-amigosecreto.firebaseapp.com",
    projectId: "churrasco-com-amigosecreto",
    storageBucket: "churrasco-com-amigosecreto.firebasestorage.app",
    messagingSenderId: "780934998934",
    appId: "1:780934998934:web:fc30e057ef1b31b3438bb7"
};

// Inicializa Firebase apenas se não houver um app ativo
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore(); 

// --- CONFIGURAÇÃO DA FESTA ---
const ID_FESTA = 'MARCO_2026'; 
const SENHA_ADMIN = "860322"; 
// Referência direta para a sub-coleção
const refParticipantes = db.collection('festas').doc(ID_FESTA).collection('participantes');

// --- SALVAR PRESENÇA ---
const form = document.getElementById('confirmacao-form');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('nome').value.trim();
    const acompanhantes = parseInt(document.getElementById('acompanhantes').value) || 0;
    const status = document.getElementById('mensagem-status');

    refParticipantes.add({
        nome: nome,
        acompanhantes: acompanhantes,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        status.textContent = "Confirmado! 🥩";
        status.style.background = "#e8f5e9";
        form.reset();
    }).catch(err => alert("Erro ao salvar: " + err.message));
});

// --- LISTAR EM TEMPO REAL ---
refParticipantes.orderBy('timestamp', 'desc').onSnapshot(snapshot => {
    const lista = document.getElementById('lista-presenca');
    const totalSpan = document.getElementById('total-confirmados');
    lista.innerHTML = '';
    let totalPessoas = 0;

    snapshot.docs.forEach(doc => {
        const d = doc.data();
        totalPessoas += (1 + (d.acompanhantes || 0));

        const li = document.createElement('li');
        li.style = "display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; background: #fff;";
        
        li.innerHTML = `
            <span><strong>${d.nome}</strong> (+${d.acompanhantes})</span>
            <button onclick="deletarIndividual('${doc.id}')" style="background:none; border:none; color:red; cursor:pointer; font-weight:bold; font-size: 1.2em;">×</button>
        `;
        lista.appendChild(li);
    });
    totalSpan.textContent = totalPessoas;
}, err => console.error("Erro ao ler dados: ", err));

// --- ADMIN: EXCLUIR UM ---
window.deletarIndividual = function(docId) {
    const senha = prompt("Senha Admin para excluir:");
    if (senha === SENHA_ADMIN) {
        refParticipantes.doc(docId).delete()
            .then(() => console.log("Documento removido"))
            .catch(err => alert("Erro ao excluir: " + err.message));
    } else if (senha !== null) {
        alert("Senha incorreta.");
    }
};

// --- ADMIN: REINICIAR TUDO ---
window.resetarListaCompleta = function() {
    const senha = prompt("CUIDADO! Isso apagará TODOS os nomes. Digite a senha:");
    if (senha === SENHA_ADMIN) {
        if (confirm("Tem certeza absoluta que deseja limpar tudo?")) {
            refParticipantes.get().then(snapshot => {
                if (snapshot.empty) {
                    alert("A lista já está vazia.");
                    return;
                }
                const batch = db.batch();
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                return batch.commit();
            }).then(() => {
                alert("Lista reiniciada com sucesso!");
            }).catch(err => alert("Erro ao limpar: " + err.message));
        }
    } else if (senha !== null) {
        alert("Senha incorreta.");
    }
};
