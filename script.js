// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyAqE58H0UriOexZpsDAODfNFSsi5Co4nac",
    authDomain: "churrasco-com-amigosecreto.firebaseapp.com",
    projectId: "churrasco-com-amigosecreto",
    storageBucket: "churrasco-com-amigosecreto.firebasestorage.app",
    messagingSenderId: "780934998934",
    appId: "1:780934998934:web:fc30e057ef1b31b3438bb7"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); 

// --- CONFIGURAÇÃO DA FESTA ---
const ID_FESTA = 'MARCO_2026'; 
const SENHA_ADMIN = "860322"; 
const colecaoParticipantes = db.collection('festas').doc(ID_FESTA).collection('participantes');

// Elementos
const confirmacaoForm = document.getElementById('confirmacao-form');
const listaPresenca = document.getElementById('lista-presenca');
const totalConfirmadosSpan = document.getElementById('total-confirmados');
const mensagemStatus = document.getElementById('mensagem-status');

// --- SALVAR PRESENÇA ---
confirmacaoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('nome').value.trim();
    const acompanhantes = parseInt(document.getElementById('acompanhantes').value) || 0;

    mensagemStatus.textContent = "A salvar...";

    colecaoParticipantes.add({
        nome: nome,
        acompanhantes: acompanhantes,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        mensagemStatus.textContent = "Confirmado! 🥩";
        mensagemStatus.style.background = "#e8f5e9";
        confirmacaoForm.reset();
    }).catch(() => alert("Erro ao salvar."));
});

// --- LISTAR EM TEMPO REAL ---
colecaoParticipantes.orderBy('timestamp', 'desc').onSnapshot(snapshot => {
    listaPresenca.innerHTML = '';
    let totalGeral = 0;

    snapshot.docs.forEach(doc => {
        const d = doc.data();
        totalGeral += (1 + d.acompanhantes);

        const li = document.createElement('li');
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.padding = "10px";
        li.style.borderBottom = "1px solid #eee";
        
        li.innerHTML = `
            <span><strong>${d.nome}</strong> (+${d.acompanhantes})</span>
            <button onclick="deletarIndividual('${doc.id}')" style="background:none; border:none; color:red; cursor:pointer; font-weight:bold;">×</button>
        `;
        listaPresenca.appendChild(li);
    });
    totalConfirmadosSpan.textContent = totalGeral;
});

// --- ADMIN: EXCLUIR UM ---
window.deletarIndividual = function(id) {
    if (prompt("Senha Admin:") === SENHA_ADMIN) {
        colecaoParticipantes.doc(id).delete();
    } else {
        alert("Senha incorreta.");
    }
};

// --- ADMIN: REINICIAR TUDO ---
window.resetarListaCompleta = function() {
    if (prompt("Digite a senha para LIMPAR TUDO:") === SENHA_ADMIN) {
        colecaoParticipantes.get().then(snapshot => {
            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            batch.commit().then(() => alert("Lista reiniciada!"));
        });
    } else {
        alert("Senha incorreta.");
    }
};
