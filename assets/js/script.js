document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos DOM (CONFIRA SE CORRESPONDEM AO SEU HTML) ---
    const mainGorillaImgStatus = document.getElementById('main-gorilla-img');
    const arenaGorillaImg = document.getElementById('arena-gorilla-img');
    const arenaHumanImg = document.getElementById('arena-human-img');
    const gorillaImageToAnimate = arenaGorillaImg || mainGorillaImgStatus; // Prioriza arena

    const gorillaHealthProgress = document.getElementById('gorilla-health-progress');
    const gorillaHealthText = document.getElementById('gorilla-health-text');
    const gorillaEnergyProgress = document.getElementById('gorilla-energy-progress');
    const gorillaEnergyText = document.getElementById('gorilla-energy-text');
    const gorillaDefenseProgress = document.getElementById('gorilla-defense-progress');
    const gorillaDefenseText = document.getElementById('gorilla-defense-text');
    const gorillaAttacksCountText = document.getElementById('gorilla-attacks-count');

    const humansRemainingText = document.getElementById('humans-remaining-text');
    const humanRepresentativesContainer = document.getElementById('human-representatives-container');

    const attackBtn = document.getElementById('attack-btn');
    const defendBtn = document.getElementById('defend-btn');
    const restBtn = document.getElementById('rest-btn');
    const mainRestartBtn = document.getElementById('restart-btn'); // Botão nos controles

    const logEntriesContainer = document.getElementById('log-entries-container');

    const gameOverSection = document.getElementById('game-over-section');
    const gameOverMessage = document.getElementById('game-over-message');
    const restartGameBtnGameOver = document.getElementById('restart-game-btn'); // Botão no game over

    // --- Áudio ---
    const sounds = {
        gorillaAttack: document.getElementById('sound-gorilla-attack'),
        gorillaHurt: document.getElementById('sound-gorilla-hurt'),
        humanAttack: document.getElementById('sound-human-attack'),
        humanDie: document.getElementById('sound-human-die'),
        gorillaDefend: document.getElementById('sound-gorilla-defend'),
        gorillaRest: document.getElementById('sound-gorilla-rest'),
        gameWin: document.getElementById('sound-game-win'),
        gameLose: document.getElementById('sound-game-lose')
    };

    // --- Constantes ---
    const MAX_GORILLA_HEALTH = 100, MAX_GORILLA_ENERGY = 50, MAX_GORILLA_DEFENSE_BONUS = 30;
    const TOTAL_HUMANS = 100, NUM_REPRESENTATIVE_IMAGES = 10;
    const HUMANS_PER_REPRESENTATIVE = TOTAL_HUMANS / NUM_REPRESENTATIVE_IMAGES;
    const ATTACK_ENERGY_COST = 10, DEFEND_ENERGY_COST = 15, DEFEND_BONUS_GAIN = 10, REST_ENERGY_GAIN = 20;
    const GORILLA_ATTACK_POWER_MIN = HUMANS_PER_REPRESENTATIVE * 1, GORILLA_ATTACK_POWER_MAX = HUMANS_PER_REPRESENTATIVE * 3;
    const HUMANS_ATTACK_POWER_MIN = 5, HUMANS_ATTACK_POWER_MAX = 15, HUMANS_ATTACK_CHANCE = 0.75;

    // --- Estado do Jogo ---
    let gorillaState, humansAliveCount, representativeHumans;
    let currentPlayerTurn, isAnimating, isGameOver;

    // --- Funções Auxiliares ---
    function playSound(soundElement) {
        if (soundElement && typeof soundElement.play === 'function') {
            soundElement.currentTime = 0;
            soundElement.play().catch(e => console.warn("Falha ao tocar som:", soundElement.id, e));
        }
    }

    function animate(element, animationClass, duration = 500) {
        return new Promise(resolve => {
            if (!element) { resolve(); return; }
            element.classList.add(animationClass);
            setTimeout(() => {
                element.classList.remove(animationClass);
                resolve();
            }, duration);
        });
    }

    // --- Inicialização e Reset ---
    function initializeGame() {
        console.log("INIT: Iniciando jogo...");
        
        const loadedSuccessfully = loadGameState(); 

        if (!loadedSuccessfully || !isGameOver) { 
            if(!loadedSuccessfully) { // Se não carregou NADA, reseta as variáveis e o log
                resetGameVariables(); 
                clearLog(); // Limpa o DOM do log
                addLogEntry("A Batalha Começa! Turno do Gorila.", "system");
            } else {
                // Se carregou um jogo que NÃO estava game over, o log já foi restaurado por loadGameState.
                // Apenas garantimos que a última mensagem seja sobre o turno atual.
                // Se loadGameState restaurou o log, não limpamos.
                 addLogEntry("Jogo Continuado. Turno do Gorila.", "system");
            }
            isGameOver = false; // Garante que não está game over se não foi carregado como tal
            currentPlayerTurn = 'gorilla';
            isAnimating = false;
        }
        // Se isGameOver é true (carregado do save), a UI de game over já foi configurada por loadGameState.

        updateAllDisplays(); 
        if (gameOverSection) gameOverSection.style.display = isGameOver ? 'block' : 'none';
        enableActionButtons(!isGameOver); 
        console.log("INIT: Jogo inicializado. Turno:", currentPlayerTurn, "Animating:", isAnimating, "GameOver:", isGameOver);
    }

    function resetGameVariables() {
        console.log("RESET: Resetando variáveis do jogo.");
        gorillaState = { health: MAX_GORILLA_HEALTH, energy: MAX_GORILLA_ENERGY, defenseBonus: 0, attacksMade: 0 };
        humansAliveCount = TOTAL_HUMANS;
        representativeHumans = Array.from({ length: NUM_REPRESENTATIVE_IMAGES }, (_, i) => ({
            id: i, alive: true, health: HUMANS_PER_REPRESENTATIVE
        }));
    }
    
    function updateAllDisplays() {
        updateGorillaStatusDisplay();
        renderRepresentativeHumans();
        updateHumansRemainingDisplay();
    }

    // --- Atualizações de Display ---
    function updateGorillaStatusDisplay() {
        if (gorillaHealthProgress) gorillaHealthProgress.value = gorillaState.health;
        if (gorillaHealthText) gorillaHealthText.textContent = `${gorillaState.health}/${MAX_GORILLA_HEALTH}`;
        if (gorillaEnergyProgress) gorillaEnergyProgress.value = gorillaState.energy;
        if (gorillaEnergyText) gorillaEnergyText.textContent = `${gorillaState.energy}/${MAX_GORILLA_ENERGY}`;
        if (gorillaDefenseProgress) gorillaDefenseProgress.value = gorillaState.defenseBonus;
        if (gorillaDefenseText) gorillaDefenseText.textContent = `${gorillaState.defenseBonus}`;
        if (gorillaAttacksCountText) gorillaAttacksCountText.textContent = gorillaState.attacksMade;
        if (gorillaHealthProgress) gorillaHealthProgress.classList.toggle('low-health', gorillaState.health < MAX_GORILLA_HEALTH * 0.3);
        if (gorillaEnergyProgress) gorillaEnergyProgress.classList.toggle('low-energy', gorillaState.energy < MAX_GORILLA_ENERGY * 0.3);
    }

    function renderRepresentativeHumans() {
        if (!humanRepresentativesContainer) return;
        humanRepresentativesContainer.innerHTML = '';
        representativeHumans.forEach(rep => {
            const repImg = document.createElement('img');
            repImg.src = "./assets/img/humano.png";
            repImg.alt = `Grupo de Humanos ${rep.id + 1}`;
            repImg.classList.add('human-representative-img');
            repImg.dataset.representativeId = rep.id;
            if (!rep.alive) repImg.classList.add('defeated');
            humanRepresentativesContainer.appendChild(repImg);
        });
    }

    function updateHumansRemainingDisplay() {
        if (humansRemainingText) humansRemainingText.textContent = Math.max(0, humansAliveCount); // Garante que não seja negativo
    }

    // --- Log de Batalha ---
    function addLogEntry(message, type = "info") {
        if (!logEntriesContainer) { console.error("Elemento do Log não encontrado!"); return; }
        // console.log(`LOG [${type.toUpperCase()}]: ${message}`); // Log no console para depuração

        const logEntry = document.createElement('div');
        logEntry.classList.add('log-entry', `log-entry-${type}`); 
        
        const timestampSpan = document.createElement('span');
        timestampSpan.className = 'log-timestamp';
        timestampSpan.textContent = `[${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }] `;
        
        logEntry.appendChild(timestampSpan);
        logEntry.appendChild(document.createTextNode(message));

        logEntriesContainer.prepend(logEntry); // Adiciona no topo
        
        // Limita o número de entradas no DOM para performance, mas o log salvo pode ser maior
        while (logEntriesContainer.children.length > 75) { 
            logEntriesContainer.removeChild(logEntriesContainer.lastChild);
        }
        // Não chama saveGameState() aqui diretamente para evitar saves excessivos.
        // O saveGameState é chamado após ações de turno.
    }
    function clearLog() {
        if (logEntriesContainer) logEntriesContainer.innerHTML = '';
        // Não limpa o localStorage aqui, isso deve ser feito em um reset explícito do jogo.
    }

    // --- Animações de Combate ---
    async function animateGorillaActionEffect(animationType = 'attack-animation', duration = 600) {
        if (gorillaImageToAnimate) await animate(gorillaImageToAnimate, animationType, duration);
    }
    
    async function animateRepresentativeDefeat(representativeElement) {
        if (representativeElement) {
            await animate(representativeElement, 'hit-by-gorilla', 300);
            representativeElement.classList.add('defeated');
            playSound(sounds.humanDie);
        }
    }
    
    async function animateGorillaDamageEffect(damageAmount) {
        // Adicionar um log para ver se a função é chamada e com qual valor
        console.log(`animateGorillaDamageEffect CALLED with damage: ${damageAmount}`)

        if (gorillaImageToAnimate) {
            console.log('Gorilla image to animate:', gorillaImageToAnimate);
            await animate(gorillaImageToAnimate, 'shake', 700);
        } else {
            console.error('gorillaImageToAnimate is NULL or UNDEFINED');
            // Se não há imagem para animar o shake, talvez não devêssemos nem tentar o dano flutuante.
            // Ou talvez haja uma imagem padrão para o dano flutuante?
            // Por ora, vamos logar e continuar para ver se o texto de dano pode ser anexado a outro lugar.
        }

        playSound(sounds.gorillaHurt);

        if (damageAmount > 0) { // Somente mostrar dano se houver dano real
            // Priorizar a figura principal do gorila no painel de status para o dano flutuante
            const mainGorillaFigure = document.querySelector('.gorilla-status .gorilla-main-figure');
            console.log('mainGorillaFigure element:', mainGorillaFigure);

            let parentForDamageFloat = null;

            // Determinar o pai para o texto de dano
            if (mainGorillaFigure && gorillaImageToAnimate && mainGorillaFigure.contains(gorillaImageToAnimate)) {
                parentForDamageFloat = mainGorillaFigure;
                console.log('Parent para dano flutuante (mainGorillaFigure):', parentForDamageFloat);
            } else if (gorillaImageToAnimate) { 
                // Fallback se a imagem principal não for a que está sendo "shaken"
                // ou se gorillaImageToAnimate for, por exemplo, arenaGorillaImg
                parentForDamageFloat = gorillaImageToAnimate.closest('.fighter') || gorillaImageToAnimate.parentElement;
                console.log('Parent para dano flutuante (fallback a partir de gorillaImageToAnimate):', parentForDamageFloat);
            } else if (mainGorillaFigure) {
                // Se gorillaImageToAnimate for nulo, mas temos mainGorillaFigure, podemos usar como um último recurso?
                parentForDamageFloat = mainGorillaFigure;
                console.log('Parent para dano flutuante (fallback para mainGorillaFigure, pois gorillaImageToAnimate era nulo):', parentForDamageFloat);
            }

            if (parentForDamageFloat) {
                // Garantir que o pai direto para o texto de dano tenha position: relative
                if (getComputedStyle(parentForDamageFloat).position === 'static') {
                    parentForDamageFloat.style.position = 'relative';
                    console.log('Aplicado position:relative ao parentForDamageFloat:', parentForDamageFloat);
                }
                
                // debugger; // Ponto de interrupção para inspecionar no navegador
                console.log('Criando texto de dano com valor:', damageAmount);
                const damageTextEl = document.createElement('div');
                damageTextEl.textContent = `-${damageAmount}`;
                damageTextEl.className = 'damage-float'; 
                parentForDamageFloat.appendChild(damageTextEl);
                console.log('Elemento de dano flutuante CRIADO e ANEXADO:', damageTextEl);
                
                setTimeout(() => {
                    if (damageTextEl.parentElement) { 
                        damageTextEl.remove();
                        console.log('Elemento de dano flutuante REMOVIDO.');
                    }
                }, 1000); // Duração da animação CSS
            } else {
                console.error('Não foi possível determinar um parentForDamageFloat. Texto de dano não será exibido.');
            }
        } else {
            console.log('Nenhum dano (ou dano <= 0), texto de dano não será exibido.');
        }
    }

    // --- Ações do Gorila ---
    async function handleGorillaAction(actionLogic, sound, logMessage, animation, energyCost, passTurnArgs = [true]) {
        console.log(`ACTION: Tentando ${logMessage}. Animando: ${isAnimating}, Turno: ${currentPlayerTurn}, Energia: ${gorillaState.energy}, Custo: ${energyCost}`);
        if (isGameOver || isAnimating || currentPlayerTurn !== 'gorilla' || (energyCost && gorillaState.energy < energyCost)) {
            if (!isAnimating && currentPlayerTurn === 'gorilla' && energyCost && gorillaState.energy < energyCost) {
                addLogEntry(`Gorila com pouca energia para ${logMessage.toLowerCase().split(' ')[0]}!`, "system");
                if (gorillaImageToAnimate) await animate(gorillaImageToAnimate, 'shake', 300);
            }
            return;
        }

        isAnimating = true; // TRAVA AQUI
        enableActionButtons(false);

        if (energyCost) {
            gorillaState.energy -= energyCost;
        }
        gorillaState.attacksMade += (logMessage.includes("ATAQUE") ? 1 : 0); // Só incrementa se for ataque
        updateGorillaStatusDisplay();
        playSound(sound);
        addLogEntry(logMessage, "gorilla");
        if (animation) await animateGorillaActionEffect(animation.type, animation.duration);

        await actionLogic(); // Executa a lógica específica da ação (ex: causar dano)

        // isAnimating será resetado em endHumansTurn
        endGorillaTurn(...passTurnArgs);
    }

    if (attackBtn) attackBtn.addEventListener('click', () => handleGorillaAction(
        async () => { // actionLogic
            let damageDealt = Math.floor(Math.random() * (GORILLA_ATTACK_POWER_MAX - GORILLA_ATTACK_POWER_MIN + 1)) + GORILLA_ATTACK_POWER_MIN;
            let remainingDamageToDeal = damageDealt;
            let humansDefeatedLog = 0;

            for (let rep of representativeHumans) {
                if (rep.alive && remainingDamageToDeal > 0) {
                    const damageToThisRep = Math.min(rep.health, remainingDamageToDeal);
                    rep.health -= damageToThisRep;
                    humansAliveCount -= damageToThisRep;
                    remainingDamageToDeal -= damageToThisRep;
                    humansDefeatedLog += damageToThisRep;
                    if (rep.health <= 0) {
                        rep.alive = false;
                        const repElement = humanRepresentativesContainer?.querySelector(`[data-representative-id="${rep.id}"]`);
                        if(repElement) await animateRepresentativeDefeat(repElement);
                    }
                }
            }
            humansAliveCount = Math.max(0, humansAliveCount);
            if (humansDefeatedLog > 0) addLogEntry(`Gorila ATACA e causa ${humansDefeatedLog} de "baixas"!`, "gorilla");
            else if (humansAliveCount > 0) addLogEntry("Gorila ataca, mas os humanos resistem!", "gorilla");
            updateHumansRemainingDisplay();
            renderRepresentativeHumans(); // Atualiza visual dos representantes
        },
        sounds.gorillaAttack,
        "Gorila se prepara para o ATAQUE!",
        { type: 'attack-animation', duration: 600 },
        ATTACK_ENERGY_COST
    ));

    if (defendBtn) defendBtn.addEventListener('click', () => handleGorillaAction(
        async () => { // actionLogic
            gorillaState.defenseBonus = Math.min(MAX_GORILLA_DEFENSE_BONUS, gorillaState.defenseBonus + DEFEND_BONUS_GAIN);
            updateGorillaStatusDisplay(); // Atualiza o display da defesa
             addLogEntry(`Bônus de Defesa aumentado para ${gorillaState.defenseBonus}.`, "gorilla");
        },
        sounds.gorillaDefend,
        "Gorila assume postura DEFENSIVA!",
        { type: 'defense-animation', duration: 800 },
        DEFEND_ENERGY_COST
    ));

    if (restBtn) restBtn.addEventListener('click', () => handleGorillaAction(
        async () => { // actionLogic
            const energyGained = Math.min(REST_ENERGY_GAIN, MAX_GORILLA_ENERGY - gorillaState.energy);
            if (energyGained > 0) {
                gorillaState.energy += energyGained;
                updateGorillaStatusDisplay();
                addLogEntry(`Gorila recupera ${energyGained} de energia. Energia atual: ${gorillaState.energy}.`, "gorilla");
            } else {
                addLogEntry("Gorila tenta descansar, mas já está com energia máxima!", "system");
            }
        },
        sounds.gorillaRest,
        "Gorila DESCANSA...",
        { type: 'rest-animation', duration: 1000 },
        0, // Sem custo de energia para descansar
        [false] // humansShouldAttack = false
    ));

    // --- Lógica de Turno ---
    function endGorillaTurn(humansShouldAttack = true) {
        console.log(`END GORILLA TURN: humansShouldAttack: ${humansShouldAttack}. GameOver: ${isGameOver}`);
        saveGameState(); // Salva o estado após a ação do gorila
        if (checkGameEndConditions()) { // Verifica se o gorila venceu
            // isAnimating já deve ser true aqui, triggerGameOver vai setar para false.
            // enableActionButtons(false) será chamado por triggerGameOver
            return;
        }

        currentPlayerTurn = 'humans';
        addLogEntry("Turno dos Humanos...", "system");
        // enableActionButtons(false); // Já desabilitado pela ação do gorila

        if (humansShouldAttack && humansAliveCount > 0) {
            setTimeout(humansTurnAction, 1200);
        } else {
            if (humansAliveCount <= 0 && !isGameOver) { // Loga apenas se o jogo não acabou de terminar
                // Esta condição deve ser pega por checkGameEndConditions antes
            } else if (!isGameOver) {
                 addLogEntry("Humanos observam cautelosamente...", "human");
            }
            // Mesmo se não atacarem, finalizamos o ciclo para resetar flags e passar o turno
            setTimeout(endHumansTurn, 1000);
        }
    }

    async function humansTurnAction() {
        console.log("HUMANS TURN ACTION: Iniciando ação dos humanos.");
        // isAnimating já foi setado para true pela ação do gorila.

        if (isGameOver || humansAliveCount <= 0) {
            console.log("HUMANS TURN ACTION: Jogo terminado ou humanos derrotados. Encerrando turno dos humanos.");
            endHumansTurn(); // Leva ao reset de isAnimating e troca de turno
            return;
        }

        const attackRoll = Math.random();
        console.log(`HUMANS TURN ACTION: Attack roll: ${attackRoll.toFixed(2)} (Chance: ${HUMANS_ATTACK_CHANCE})`);

        if (attackRoll < HUMANS_ATTACK_CHANCE) {
            playSound(sounds.humanAttack);
            addLogEntry(`Humanos se preparam para o ATAQUE!`, "human");
            console.log("HUMANS TURN ACTION: Humanos decidiram atacar.");
            if (arenaHumanImg) await animate(arenaHumanImg, 'attack-animation', 500);
            await new Promise(resolve => setTimeout(resolve, 800)); // Pequena pausa para o log aparecer antes do resultado

            let potentialDamage = Math.floor(Math.random() * (HUMANS_ATTACK_POWER_MAX - HUMANS_ATTACK_POWER_MIN + 1)) + HUMANS_ATTACK_POWER_MIN;
            const damageAbsorbed = Math.min(potentialDamage, gorillaState.defenseBonus);
            const damageTaken = Math.max(0, potentialDamage - gorillaState.defenseBonus);

            console.log(`HUMANS TURN ACTION: Potential Damage: ${potentialDamage}, Defense Bonus: ${gorillaState.defenseBonus}, Absorbed: ${damageAbsorbed}, Taken: ${damageTaken}`);

            gorillaState.health = Math.max(0, gorillaState.health - damageTaken);
            
            if (damageTaken > 0) {
                addLogEntry(`Gorila é atingido e sofre ${damageTaken} de dano! (Defendido: ${damageAbsorbed})`, "human");
                console.log("HUMANS TURN ACTION: Gorila sofreu dano. Chamando animateGorillaDamageEffect.");
                await animateGorillaDamageEffect(damageTaken);
            } else if (potentialDamage > 0) {
                addLogEntry("O ataque dos humanos é totalmente bloqueado pela defesa do Gorila!", "human");
                console.log("HUMANS TURN ACTION: Ataque bloqueado pela defesa.");
                if(gorillaImageToAnimate) await animate(gorillaImageToAnimate, 'defense-success-animation', 600);
            } else {
                // Este caso (potentialDamage <= 0) não deveria acontecer com a fórmula atual, mas é bom ter um log
                addLogEntry("Humanos tentam um ataque, mas falham em causar impacto (dano potencial foi zero)!", "human");
                console.log("HUMANS TURN ACTION: Ataque com dano potencial zero.");
                await new Promise(resolve => setTimeout(resolve, 800));
            }
            updateGorillaStatusDisplay();

            if (gorillaState.defenseBonus > 0 && damageAbsorbed > 0) {
                gorillaState.defenseBonus = Math.max(0, gorillaState.defenseBonus - Math.ceil(DEFEND_BONUS_GAIN / 3)); // Reduz um pouco a defesa se usada
                addLogEntry("A defesa bônus do Gorila enfraquece após absorver dano.", "system");
                console.log(`HUMANS TURN ACTION: Defesa do gorila reduzida para ${gorillaState.defenseBonus}`);
                updateGorillaStatusDisplay();
            }
        } else {
            addLogEntry("Humanos hesitam e decidem não atacar desta vez.", "human");
            console.log("HUMANS TURN ACTION: Humanos decidiram NÃO atacar.");
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        endHumansTurn(); 
    }

    function endHumansTurn() {
        console.log("END HUMANS TURN: Finalizando turno dos humanos.");
        isAnimating = false; // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< PONTO CRÍTICO PARA DESTRAVAR
        saveGameState(); // Salva o estado após o turno dos humanos
        
        if (checkGameEndConditions()) { // Verifica se os humanos venceram
            enableActionButtons(false); // Garante que os botões fiquem desabilitados
            return;
        }
        
        currentPlayerTurn = 'gorilla';
        addLogEntry("Turno do Gorila! Prepare sua ação.", "system");
        enableActionButtons(true); // Reabilita botões para o gorila
        console.log("END HUMANS TURN: Próximo turno do Gorila. Animating:", isAnimating);
    }

    // --- Fim de Jogo e Reinício ---
    function checkGameEndConditions() {
        if (isGameOver) return true;
        if (gorillaState.health <= 0) {
            triggerGameOver("Os humanos venceram! O Gorila foi derrotado.", sounds.gameLose); return true;
        }
        if (humansAliveCount <= 0) {
            triggerGameOver("O Gorila venceu! Todos os humanos foram eliminados.", sounds.gameWin); return true;
        }
        return false;
    }

    function triggerGameOver(message, soundToPlay) {
        if(isGameOver) return; 
        // console.log("GAME OVER:", message);
        isGameOver = true;
        isAnimating = false; 
        currentPlayerTurn = 'none';
        enableActionButtons(false);
        
        playSound(soundToPlay);
        if (gameOverMessage) gameOverMessage.textContent = message;
        if (gameOverSection) gameOverSection.style.display = 'block';
        addLogEntry(message, "system end-game-message");
        saveGameState(); 
    }
    
    function fullGameRestart(){
        console.log("RESTART: Reiniciando o jogo completamente.");
        localStorage.removeItem(LOCAL_STORAGE_KEY); // Garante que o save anterior seja limpo para um reset total
        
        // Força o reset de todas as variáveis de controle de estado ANTES de chamar initializeGame
        isGameOver = false;
        isAnimating = false;
        currentPlayerTurn = undefined; // Para que initializeGame saiba que é um novo começo
        resetGameVariables(); // Reseta os dados do jogo (vida, energia, humanos)
        
        // Agora chama initializeGame, que irá configurar o resto (log, UI, etc.)
        initializeGame();
    }

    if (restartGameBtnGameOver) restartGameBtnGameOver.addEventListener('click', fullGameRestart);
    if (mainRestartBtn) mainRestartBtn.addEventListener('click', fullGameRestart);

    function enableActionButtons(enable) {
        const canInteract = enable && !isAnimating && currentPlayerTurn === 'gorilla' && !isGameOver;
        console.log(`UI: enableActionButtons(${enable}) -> canInteract: ${canInteract} (isAnimating: ${isAnimating}, turn: ${currentPlayerTurn}, gameOver: ${isGameOver})`);
        
        if(attackBtn) attackBtn.disabled = !canInteract;
        if(defendBtn) defendBtn.disabled = !canInteract;
        if(restBtn) restBtn.disabled = !canInteract;
        if(mainRestartBtn) mainRestartBtn.disabled = isAnimating; // Botão de reiniciar principal pode ser desabilitado durante animações
    }
    
    // --- LocalStorage ---
    const LOCAL_STORAGE_KEY = 'gorillaBassGameState_v5'; // Nova versão para incluir log
    function saveGameState() {
        const logEntriesToSave = [];
        if (logEntriesContainer) {
            // Pega as entradas do log do DOM, mas apenas o texto e o tipo para recriar
            // Poderia pegar as 50 mais recentes, por exemplo.
            // Ou salvar todas e deixar o loadGameState decidir quantas carregar.
            // Vamos salvar as entradas atuais no DOM.
            for (let i = 0; i < logEntriesContainer.children.length; i++) {
                const entryElement = logEntriesContainer.children[i];
                const type = entryElement.className.replace('log-entry ', '').replace('log-entry-', '');
                const textContent = entryElement.textContent.substring(entryElement.textContent.indexOf('] ') + 2); // Remove timestamp
                logEntriesToSave.push({ text: textContent, type: type });
            }
        }

        const gameStateToSave = {
            gorillaState, 
            representativeHumans, 
            humansAliveCount, 
            isGameOver,
            logEntries: logEntriesToSave.slice(0, 50).reverse() // Salva as últimas 50, e inverte para ordem correta ao carregar
        };
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameStateToSave));
            console.log("GAME SAVED. GameOver state:", isGameOver, "Log entries saved:", logEntriesToSave.length);
        } catch (e) {
            console.error("Erro ao salvar:", e); addLogEntry("Erro ao salvar jogo.", "error");
        }
    }

    function loadGameState() {
        const savedGameString = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!savedGameString) {
            console.log("LOAD: Nenhum save encontrado, resetando variáveis.");
            // resetGameVariables(); // Não reseta aqui, deixa initializeGame decidir
            return false; 
        }

        try {
            const loadedState = JSON.parse(savedGameString);
            if (loadedState && loadedState.gorillaState && loadedState.representativeHumans && typeof loadedState.humansAliveCount === 'number') {
                gorillaState = loadedState.gorillaState;
                representativeHumans = loadedState.representativeHumans;
                humansAliveCount = loadedState.humansAliveCount;
                isGameOver = loadedState.isGameOver || false; 
                
                gorillaState.health = Math.min(gorillaState.health, MAX_GORILLA_HEALTH);
                gorillaState.energy = Math.min(gorillaState.energy, MAX_GORILLA_ENERGY);

                // Restaura o log
                clearLog(); // Limpa o log atual no DOM antes de carregar
                if (loadedState.logEntries && Array.isArray(loadedState.logEntries)) {
                    loadedState.logEntries.forEach(entry => {
                        addLogEntry(entry.text, entry.type); // Adiciona na ordem salva (já invertida no save)
                    });
                }
                
                addLogEntry("Jogo anterior carregado!", "system");
                console.log("LOAD: Jogo carregado. GameOver:", isGameOver, "Log entries loaded:", loadedState.logEntries ? loadedState.logEntries.length : 0);

                if (isGameOver) {
                    let msg = gorillaState.health <= 0 ? "Os humanos venceram! O Gorila foi derrotado." : "O Gorila venceu! Todos os humanos foram eliminados.";
                    if (gameOverMessage) gameOverMessage.textContent = msg;
                    if (gameOverSection) gameOverSection.style.display = 'block';
                    enableActionButtons(false); 
                }
                return true; 
            }
        } catch (e) { 
            console.warn("LOAD: Falha ao carregar/parsear save. Erro:", e);
        }
        
        console.warn("LOAD: Save inválido ou dados faltando. Considerado como novo jogo.");
        localStorage.removeItem(LOCAL_STORAGE_KEY); // Remove save inválido
        // resetGameVariables(); // Não reseta aqui, deixa initializeGame decidir
        return false;
    }

    // --- Iniciar o Jogo ---
    initializeGame();
});