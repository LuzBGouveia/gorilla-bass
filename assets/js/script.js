document.addEventListener('DOMContentLoaded', () => {
    //Elementos DOM
    const mainGorillaImg = document.getElementById('main-gorilla-img');

    const gorillaHealthProgress = document.getElementById('gorilla-health-progress');
    const gorillaHealthText = document.getElementById('gorilla-health-text');
    const gorillaEnergyProgress = document.getElementById('gorilla-energy-progress');
    const gorillaEnergyText = document.getElementById('gorilla-energy-text');
    const gorillaDefenseProgress = document.getElementById('gorilla-defense-progress');
    const gorillaDefenseText = document.getElementById('gorilla-defense-text');
    const gorillaAttacksCountText = document.getElementById('gorilla-attacks-count');

    const humansRemainingText = document.getElementById('humans-remaining-text');
    const humansGridContainer = document.getElementById('humans-grid-container');

    const attackBtn = document.getElementById('attack-btn');
    const defendBtn = document.getElementById('defend-btn');
    const resetBtn = document.getElementById('reset-btn');

    const logEntriesContainer = document.getElementById('log-entries-container');

    const gameOverSection = document.getElementById('game-over-section');
    const gameOverMessage = document.getElementById('game-over-message');
    const restartBtn = document.getElementById('restart-btn');

    // Constantes do jogo
    const MAX_GORILLA_HEALTH = 100;
    const MAX_GORILLA_ENERGY = 50;
    const MAX_GORILLA_DEFENSE_BONUS = 30;
    const TOTAL_HUMANS = 100;

    const ATTACK_ENERGY_COST = 10;
    const DEFEND_ENERGY_COST = 15; // Custo para defender
    const DEFEND_BONUS_GAIN = 10; // Ganho de bônus de defesa
    const REST_ENERGY_GAIN = 20;  // Ganho de energia ao descansar

    const HUMANS_TO_ATTACK_MIN = 2; // Gorila ataca no mínimo X humanos
    const HUMANS_TO_ATTACK_MAX = 5; // Gorila ataca no máximo X humanos

    const HUMANS_ATTACK_POWER_MIN = 1;
    const HUMANS_ATTACK_POWER_MAX = 2;
    const HUMANS_ATTACK_CHANCE_PER_HUMAN_GROUP = 0.25; // 25% de chance de um grupo de humanos atacar
    const NUM_HUMANS_IN_ATTACKING_GROUP = 5; // Quantos humanos atacam juntos como um "grupo"

    //Variáveis de estado do jogo
    let gorillaState = {
        health: MAX_GORILLA_HEALTH,
        energy: MAX_GORILLA_ENERGY,
        defenseBonus: 0,
        attacksMade: 0
    };

    let humansArray = [];
    let humansAliveCount = TOTAL_HUMANS;

    let currentPlayerTurn = 'gorilla'; // 'gorilla' ou 'humans'
    let isAnimating = false; // Trava ações durante animações
    let isGameOver = false;

    //Inicialização do jogo
    function initializeGame() { 
        // Tenta carregar o estado salvo
        if (loadGameState()) {
            // Se carregou, verifica se o jogo já tinha acabado
            if (gorillaState.health <= 0 || humansAliveCount <= 0) {
                resetGameVariables(); // Reseta para um novo jogo se o carregado estava "game over"
            }
        } else {
            resetGameVariables(); // Se não carregou, reseta para um novo jogo
        }

        isGameOver = false; // Garante que não está game over
        currentPlayerTurn = 'gorilla';
        isAnimating = false;

        updateGorillaStatusDisplay();
        renderHumans(); // Renderiza os humanos (pode ser otimizado se já estão no DOM do save)
        updateHumansRemainingDisplay();
        clearLog();
        addLogEntry("A Batalha Começa! Turno do Gorila.", "system");
        gameOverSection.style.display = 'none';
        enableActionButtons(true);
    }

    function resetGameVariables() {
        gorillaState = {
            health: MAX_GORILLA_HEALTH,
            energy: MAX_GORILLA_ENERGY,
            defenseBonus: 0,
            attacksMade: 0
        };
        humansAliveCount = TOTAL_HUMANS;
        initializeHumansArray(); // Cria o array de humanos
    }

    function initializeHumansArray() {
        humansArray = [];
        for (let i = 0; i < TOTAL_HUMANS; i++) {
            // Cada humano é um objeto com 'id' e 'alive'
            humansArray.push({ id: i, alive: true });
        }
    }

    //Atualizações de Display
    function updateGorillaStatusDisplay() {
        gorillaHealthProgress.value = gorillaState.health;
        gorillaHealthProgress.max = MAX_GORILLA_HEALTH;
        gorillaHealthText.textContent = `${gorillaState.health}/${MAX_GORILLA_HEALTH}`;

        gorillaEnergyProgress.value = gorillaState.energy;
        gorillaEnergyProgress.max = MAX_GORILLA_ENERGY;
        gorillaEnergyText.textContent = `${gorillaState.energy}/${MAX_GORILLA_ENERGY}`;

        gorillaDefenseProgress.value = gorillaState.defenseBonus;
        gorillaDefenseProgress.max = MAX_GORILLA_DEFENSE_BONUS;
        gorillaDefenseText.textContent = `${gorillaState.defenseBonus}`;
        
        gorillaAttacksCountText.textContent = gorillaState.attacksMade;

        // Adicionar classes 'low' se necessário (requer CSS)
        gorillaHealthProgress.classList.toggle('low-health', gorillaState.health < MAX_GORILLA_HEALTH * 0.3);
        gorillaEnergyProgress.classList.toggle('low-energy', gorillaState.energy < MAX_GORILLA_ENERGY * 0.3);
    }

    function renderHumans() {
        humansGridContainer.innerHTML = ''; // Limpa a grade
        humansArray.forEach(human => {
            const humanDiv = document.createElement('div');
            humanDiv.classList.add('human'); // Classe base do seu CSS
            humanDiv.dataset.humanId = human.id; // Para identificar o humano
            if (human.alive) {
                humanDiv.classList.add('alive');
                // Adicionar imagem de humano vivo se desejar, ou deixar o CSS cuidar disso
            } else {
                humanDiv.classList.add('dead');
                // Adicionar "X" ou imagem de humano morto
            }
            humansGridContainer.appendChild(humanDiv);
        });
        updateHumansRemainingDisplay();
    }

    function updateHumansRemainingDisplay() {
        humansRemainingText.textContent = humansAliveCount;
    }

    // --- Log de Batalha ---
    function addLogEntry(message, type = "info") {
        const logEntry = document.createElement('div');
        logEntry.classList.add('log-entry'); // Classe base do seu CSS
        logEntry.classList.add(type); // Para estilização: 'gorilla', 'human', 'system'
        
        // Adicionar timestamp
        const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        logEntry.innerHTML = `<span>[${timestamp}]</span> ${message}`; // innerHTML para permitir spans se necessário

        logEntriesContainer.prepend(logEntry); // Adiciona no topo
        // Limitar o número de logs
        while (logEntriesContainer.children.length > 30) {
            logEntriesContainer.removeChild(logEntriesContainer.lastChild);
        }
    }
    function clearLog() {
        logEntriesContainer.innerHTML = '';
    }

    //Funções de Animação (Exemplos)
    // Estas funções agora retornam Promises para usar com async/await
    function animate(element, animationClass, duration = 500) {
        return new Promise(resolve => {
            if (!element) {
                console.warn("Elemento para animar não encontrado:", element);
                resolve();
                return;
            }
            element.classList.add(animationClass);
            setTimeout(() => {
                element.classList.remove(animationClass);
                resolve();
            }, duration);
        });
    }
    
    async function animateGorillaAction(animationType = 'attack-animation', duration = 500) {
        isAnimating = true;
        // Adicionar aqui a lógica para tocar som se desejar
        await animate(mainGorillaImg, animationType, duration);
        // isAnimating será setado para false pela função que chamou esta, após todas as suas operações.
    }

    async function animateHumansDefeated(defeatedHumanElements) {
        if (!defeatedHumanElements || defeatedHumanElements.length === 0) return;
        isAnimating = true; // Garante que está travado
        for (const humanEl of defeatedHumanElements) {
            humanEl.classList.remove('alive');
            humanEl.classList.add('dead'); // Classe 'dead' do seu CSS deve dar o visual de derrotado
            await animate(humanEl, 'human-defeat-animation', 300); // Crie 'human-defeat-animation' no CSS
        }
    }
    
    async function animateGorillaDamage(damageAmount) {
        isAnimating = true;
        await animate(mainGorillaImg, 'shake', 700); // 'shake' é do seu CSS

        // Mostrar texto de dano flutuante (opcional, requer CSS para .damage-float)
        if (damageAmount > 0 && mainGorillaImg.parentElement) {
            const damageTextEl = document.createElement('div');
            damageTextEl.textContent = `-${damageAmount}`;
            damageTextEl.className = 'damage-float'; // Estilize .damage-float no CSS
            mainGorillaImg.parentElement.style.position = 'relative'; // Para posicionamento absoluto
            mainGorillaImg.parentElement.appendChild(damageTextEl);
            setTimeout(() => damageTextEl.remove(), 1000); // Remove após 1s
        }
        // isAnimating será setado para false pela função que chamou esta
    }

    //Ações do Gorila
    attackBtn.addEventListener('click', async () => {
        if (isGameOver || isAnimating || currentPlayerTurn !== 'gorilla' || gorillaState.energy < ATTACK_ENERGY_COST) {
            if (gorillaState.energy < ATTACK_ENERGY_COST && !isAnimating && currentPlayerTurn === 'gorilla') {
                addLogEntry("Gorila com pouca energia para atacar!", "system");
                await animate(mainGorillaImg, 'shake', 300);
            }
            return;
        }
        
        isAnimating = true; // Bloqueia outras ações
        enableActionButtons(false);

        gorillaState.energy -= ATTACK_ENERGY_COST;
        gorillaState.attacksMade++;
        updateGorillaStatusDisplay();

        addLogEntry("Gorila se prepara para o ATAQUE!", "gorilla");
        await animateGorillaAction('attack-animation', 600); // Sua classe CSS 'attack-animation'

        let numHumansToAttack = Math.floor(Math.random() * (HUMANS_TO_ATTACK_MAX - HUMANS_TO_ATTACK_MIN + 1)) + HUMANS_TO_ATTACK_MIN;
        let humansDefeatedThisTurn = 0;
        const defeatedHumanElementsForAnimation = [];

        let humanElements = humansGridContainer.querySelectorAll('.human.alive');
        
        for (let i = 0; i < numHumansToAttack && i < humanElements.length; i++) {
            const humanElToDefeat = humanElements[i]; // Pega os primeiros N humanos vivos na grade
            const humanId = parseInt(humanElToDefeat.dataset.humanId);
            const humanObj = humansArray.find(h => h.id === humanId);

            if (humanObj && humanObj.alive) {
                humanObj.alive = false;
                humansAliveCount--;
                humansDefeatedThisTurn++;
                defeatedHumanElementsForAnimation.push(humanElToDefeat);
            }
        }

        if (humansDefeatedThisTurn > 0) {
            addLogEntry(`Gorila ATACA e derrota ${humansDefeatedThisTurn} humanos!`, "gorilla");
            await animateHumansDefeated(defeatedHumanElementsForAnimation);
        } else if (humansAliveCount > 0) {
            addLogEntry("Gorila ataca, mas erra todos os humanos restantes!", "gorilla");
        } else {
            addLogEntry("Gorila ataca, mas não há mais humanos!", "gorilla");
        }
        
        updateHumansRemainingDisplay(); // Atualiza contador
        // renderHumans(); // Opcional: se a animação já atualiza o visual, pode não ser necessário
        
        isAnimating = false; // Libera após todas as animações de ataque
        endGorillaTurn();
    });

    defendBtn.addEventListener('click', async () => {
        if (isGameOver || isAnimating || currentPlayerTurn !== 'gorilla' || gorillaState.energy < DEFEND_ENERGY_COST) {
             if (gorillaState.energy < DEFEND_ENERGY_COST && !isAnimating && currentPlayerTurn === 'gorilla') {
                addLogEntry("Gorila com pouca energia para defender!", "system");
                 await animate(mainGorillaImg, 'shake', 300);
            }
            return;
        }
        isAnimating = true;
        enableActionButtons(false);

        gorillaState.energy -= DEFEND_ENERGY_COST;
        gorillaState.defenseBonus = Math.min(MAX_GORILLA_DEFENSE_BONUS, gorillaState.defenseBonus + DEFEND_BONUS_GAIN);
        updateGorillaStatusDisplay();
        
        addLogEntry(`Gorila assume postura DEFENSIVA! (Bônus Defesa: +${DEFEND_BONUS_GAIN})`, "gorilla");
        await animateGorillaAction('defense-animation', 800); // Crie 'defense-animation' no CSS (ex: brilho azul)

        isAnimating = false;
        endGorillaTurn();
    });
})