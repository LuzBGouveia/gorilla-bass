# 🦍 Gorila vs 100 Humanos 🧑‍🤝‍🧑

Um simples jogo de navegador onde o jogador controla um Gorila lutando contra 100 Humanos. É um jogo baseado em turnos com mecânicas de ataque, defesa e descanso para o gorila, e reações automáticas dos humanos.

## 🚀 Tecnologias Utilizadas

*   **HTML5:** Estrutura da página do jogo.
*   **CSS3:** Estilização e animações visuais.
*   **JavaScript (ES6+):** Lógica do jogo, manipulação do DOM, gerenciamento de estado e interações.

## ✨ Funcionalidades Principais

*   **Sistema de Turnos:** O jogador (Gorila) e os Humanos se alternam em turnos.
*   **Ações do Gorila:**
    *   **Atacar:** Causa dano aos humanos. Custa energia.
    *   **Defender:** Aumenta o bônus de defesa para o próximo ataque dos humanos. Custa energia.
    *   **Descansar:** Recupera energia. Não custa energia.
*   **IA dos Humanos:** Os humanos têm uma chance de atacar o gorila a cada turno deles.
*   **Recursos do Gorila:**
    *   **Vida:** Diminui ao receber dano dos humanos. Se chegar a 0, o Gorila perde.
    *   **Energia:** Consumida ao realizar ações (exceto descansar).
    *   **Defesa Bônus:** Pode ser acumulada para absorver dano.
*   **Contador de Humanos:** Mostra quantos humanos ainda estão vivos. Se chegar a 0, o Gorila vence.
*   **Registro de Batalha:** Exibe as ações e eventos importantes do jogo.
*   **Efeitos Sonoros:** Para diversas ações e eventos do jogo.
*   **Animações:** Animações visuais para ataques, danos, defesa, etc.
*   **Fim de Jogo:** Mensagens claras para vitória do Gorila ou dos Humanos.
*   **Reiniciar Jogo:** Permite começar uma nova partida.
*   **Persistência de Estado:** O jogo salva o progresso no LocalStorage, permitindo continuar de onde parou.

## 🎮 Como Jogar

1.  Clone ou baixe este repositório.
2.  Abra o arquivo `index.html` em qualquer navegador web moderno (Google Chrome, Firefox, Edge, etc.).
3.  Use os botões de ação (Atacar, Defender, Descansar) para controlar o Gorila.
4.  Tente derrotar todos os 100 humanos antes que a vida do Gorila chegue a zero!

## 📁 Estrutura do Projeto

```
gorilla-bass/
├── assets/
│   ├── css/
│   │   └── style.css        # Folha de estilos principal
│   ├── img/
│   │   ├── gorila.jpeg      # Imagem principal do gorila
│   │   └── humano.png       # Imagem representativa dos humanos
│   ├── js/
│   │   └── script.js        # Lógica principal do jogo
│   └── sounds/
│       ├── dor.wav
│       ├── humanoAtaque.mp3
│       ├── monkeHurt.ogg
│       ├── monkeSound.wav
│       ├── punch.mp3
│       └── win.mp3          # Efeitos sonoros
├── index.html               # Arquivo HTML principal
└── README.md                # Este arquivo
```

--- 
## Integrantes da Equipe

*   Enzo Okuizumi RM561432
*   Lucas Barros Gouveia RM566422
*   Milton Jakson de Sousa Marcelino RM564836
*   Gustavo Bardy Casimiro RM566136