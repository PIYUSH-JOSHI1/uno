// UNO Game Implementation
document.addEventListener('DOMContentLoaded', function() {
    // Game state
    const gameState = {
        gameId: null,
        playerId: null,
        playerName: '',
        players: [],
        currentPlayer: null,
        currentColor: null,
        currentValue: null,
        direction: 1, // 1 for clockwise, -1 for counter-clockwise
        deck: [],
        discardPile: [],
        playerHand: [],
        isHost: false,
        socket: null,
        gameStage: 'welcome' // 'welcome', 'lobby', 'game'
    };

    // DOM Elements
    const loadingScreen = document.getElementById('loading-screen');
    const welcomeScreen = document.getElementById('welcome-screen');
    const lobbyScreen = document.getElementById('lobby-screen');
    const gameScreen = document.getElementById('game-screen');
    const playerNameInput = document.getElementById('player-name');
    const createGameBtn = document.getElementById('create-game');
    const joinGameBtn = document.getElementById('join-game');
    const joinModal = document.getElementById('join-modal');
    const gameCodeInput = document.getElementById('game-code');
    const cancelJoinBtn = document.getElementById('cancel-join');
    const confirmJoinBtn = document.getElementById('confirm-join');
    const gameCodeDisplay = document.getElementById('game-code-display');
    const gameCodeDisplayIngame = document.getElementById('game-code-display-ingame');
    const copyCodeBtn = document.getElementById('copy-code');
    const playerList = document.getElementById('player-list');
    const startGameBtn = document.getElementById('start-game');
    const drawPile = document.getElementById('draw-pile');
    const discardPile = document.getElementById('discard-pile');
    const playerHand = document.getElementById('cards-container');
    const otherPlayers = document.getElementById('other-players');
    const currentPlayerDisplay = document.getElementById('current-player');
    const cardsLeftDisplay = document.getElementById('cards-left');
    const colorChooser = document.getElementById('color-chooser');
    const colorButtons = document.querySelectorAll('.color-btn');
    const gameOverModal = document.getElementById('game-over');
    const winnerText = document.getElementById('winner-text');
    const playAgainBtn = document.getElementById('play-again');

    // Card colors and values
    const colors = ['red', 'blue', 'green', 'yellow'];
    const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw-two'];
    const wilds = ['wild', 'wild-draw-four'];

    // Initialize Socket.io connection
    function initializeSocket() {
        // In a real implementation, you would connect to your server
        // For this example, we'll simulate the server behavior
        console.log('Socket connection initialized');
        
        // Simulate socket events with a custom event system
        gameState.socket = {
            emit: function(event, data) {
                console.log(`Emitting ${event}:`, data);
                setTimeout(() => {
                    handleSocketEvent(event, data);
                }, 500);
            },
            on: function(event, callback) {
                document.addEventListener(`socket:${event}`, (e) => {
                    callback(e.detail);
                });
            }
        };
    }

    // Save game state to localStorage
    function saveGameState() {
        const savedState = {
            gameId: gameState.gameId,
            playerId: gameState.playerId,
            playerName: gameState.playerName,
            isHost: gameState.isHost,
            gameStage: gameState.gameStage
        };
        
        localStorage.setItem('unoGameState', JSON.stringify(savedState));
    }

    // Load game state from localStorage
    function loadGameState() {
        const savedState = localStorage.getItem('unoGameState');
        
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            
            // Update gameState with saved values
            gameState.gameId = parsedState.gameId;
            gameState.playerId = parsedState.playerId;
            gameState.playerName = parsedState.playerName;
            gameState.isHost = parsedState.isHost;
            gameState.gameStage = parsedState.gameStage;
            
            return true;
        }
        
        return false;
    }

    // Clear saved game state
    function clearGameState() {
        localStorage.removeItem('unoGameState');
    }

    // Reconnect to game
    function reconnectToGame() {
        if (gameState.gameStage === 'lobby') {
            // Reconnect to lobby
            gameState.socket.emit('reconnect-lobby', {
                gameId: gameState.gameId,
                playerId: gameState.playerId,
                playerName: gameState.playerName
            });
        } else if (gameState.gameStage === 'game') {
            // Reconnect to game
            gameState.socket.emit('reconnect-game', {
                gameId: gameState.gameId,
                playerId: gameState.playerId,
                playerName: gameState.playerName
            });
        } else {
            // Show welcome screen if no valid game state
            showScreen('welcome');
        }
    }

    // Show specific screen and hide others
    function showScreen(screen) {
        loadingScreen.classList.add('hidden');
        welcomeScreen.classList.add('hidden');
        lobbyScreen.classList.add('hidden');
        gameScreen.classList.add('hidden');
        
        if (screen === 'welcome') {
            welcomeScreen.classList.remove('hidden');
            gameState.gameStage = 'welcome';
        } else if (screen === 'lobby') {
            lobbyScreen.classList.remove('hidden');
            gameState.gameStage = 'lobby';
        } else if (screen === 'game') {
            gameScreen.classList.remove('hidden');
            gameState.gameStage = 'game';
        } else if (screen === 'loading') {
            loadingScreen.classList.remove('hidden');
        }
        
        // Save current game stage
        saveGameState();
    }

    // Simulate server responses
    function handleSocketEvent(event, data) {
        switch(event) {
            case 'create-game':
                const gameId = generateGameId();
                const createEvent = new CustomEvent('socket:game-created', { 
                    detail: { 
                        gameId: gameId,
                        playerId: generatePlayerId(),
                        isHost: true
                    } 
                });
                document.dispatchEvent(createEvent);
                break;
                
            case 'join-game':
                // Check if game exists (in a real app, this would be server-side)
                if (data.gameId && data.gameId.length === 6) {
                    const joinEvent = new CustomEvent('socket:game-joined', { 
                        detail: { 
                            gameId: data.gameId,
                            playerId: generatePlayerId(),
                            isHost: false,
                            players: simulatePlayers(data.playerName)
                        } 
                    });
                    document.dispatchEvent(joinEvent);
                } else {
                    const errorEvent = new CustomEvent('socket:error', { 
                        detail: { message: 'Game not found' } 
                    });
                    document.dispatchEvent(errorEvent);
                }
                break;
                
            case 'reconnect-lobby':
                // Simulate reconnecting to lobby
                const reconnectLobbyEvent = new CustomEvent('socket:lobby-reconnected', { 
                    detail: { 
                        players: simulateReconnectPlayers(data.playerName, data.playerId, data.isHost)
                    } 
                });
                document.dispatchEvent(reconnectLobbyEvent);
                break;
                
            case 'reconnect-game':
                // Simulate reconnecting to game
                const reconnectGameEvent = new CustomEvent('socket:game-reconnected', { 
                    detail: { 
                        players: simulateReconnectPlayers(data.playerName, data.playerId, data.isHost),
                        deck: generateDeck(),
                        currentPlayer: gameState.players.length > 0 ? gameState.players[0].id : data.playerId,
                        currentColor: colors[Math.floor(Math.random() * colors.length)],
                        currentValue: values[Math.floor(Math.random() * values.length)]
                    } 
                });
                document.dispatchEvent(reconnectGameEvent);
                break;
                
            case 'player-joined':
                const playerJoinedEvent = new CustomEvent('socket:player-joined', { 
                    detail: { 
                        player: {
                            id: generatePlayerId(),
                            name: data.playerName,
                            cardCount: 0
                        }
                    } 
                });
                document.dispatchEvent(playerJoinedEvent);
                break;
                
            case 'start-game':
                const gameStartEvent = new CustomEvent('socket:game-started', { 
                    detail: { 
                        deck: generateDeck(),
                        players: gameState.players.map(p => ({
                            ...p,
                            cardCount: 7
                        })),
                        currentPlayer: gameState.players[0].id,
                        currentColor: colors[Math.floor(Math.random() * colors.length)],
                        currentValue: values[Math.floor(Math.random() * values.length)]
                    } 
                });
                document.dispatchEvent(gameStartEvent);
                break;
                
            case 'play-card':
                const playCardEvent = new CustomEvent('socket:card-played', { 
                    detail: { 
                        playerId: data.playerId,
                        card: data.card,
                        nextPlayer: getNextPlayer(data.playerId),
                        nextColor: data.color || data.card.color,
                        remainingCards: data.playerId === gameState.playerId ? 
                            gameState.playerHand.length - 1 : 
                            gameState.players.find(p => p.id === data.playerId).cardCount - 1
                    } 
                });
                document.dispatchEvent(playCardEvent);
                break;
                
            case 'draw-card':
                const drawnCard = drawCardFromDeck();
                const drawCardEvent = new CustomEvent('socket:card-drawn', { 
                    detail: { 
                        playerId: data.playerId,
                        card: drawnCard,
                        nextPlayer: canPlayCard(drawnCard) ? data.playerId : getNextPlayer(data.playerId),
                        remainingCards: gameState.deck.length - 1
                    } 
                });
                document.dispatchEvent(drawCardEvent);
                break;
        }
    }

    // Helper functions for simulation
    function generateGameId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    function generatePlayerId() {
        return 'player_' + Math.random().toString(36).substring(2, 10);
    }

    function simulatePlayers(newPlayerName) {
        // Simulate existing players in the game
        const existingPlayers = [
            { id: 'host_player', name: 'Host', cardCount: 0 }
        ];
        
        if (gameState.players.length > 0) {
            return [...gameState.players, { id: generatePlayerId(), name: newPlayerName, cardCount: 0 }];
        }
        
        return existingPlayers;
    }

    function simulateReconnectPlayers(playerName, playerId, isHost) {
        // For reconnection, create a more realistic player list
        let players = [];
        
        if (isHost) {
            // If host, add self as first player
            players.push({ id: playerId, name: playerName, cardCount: 0 });
            
            // Add 2-4 random players
            const numPlayers = Math.floor(Math.random() * 3) + 2;
            const names = ['Alice', 'Bob', 'Charlie', 'David', 'Emma', 'Frank'];
            
            for (let i = 0; i < numPlayers; i++) {
                players.push({
                    id: generatePlayerId(),
                    name: names[i],
                    cardCount: 0
                });
            }
        } else {
            // If not host, add host first
            players.push({ id: 'host_player', name: 'Host', cardCount: 0 });
            
            // Add self
            players.push({ id: playerId, name: playerName, cardCount: 0 });
            
            // Add 1-3 random players
            const numPlayers = Math.floor(Math.random() * 3) + 1;
            const names = ['Alice', 'Bob', 'Charlie', 'David', 'Emma', 'Frank'];
            
            for (let i = 0; i < numPlayers; i++) {
                players.push({
                    id: generatePlayerId(),
                    name: names[i],
                    cardCount: 0
                });
            }
        }
        
        return players;
    }

    function getNextPlayer(currentPlayerId) {
        const currentIndex = gameState.players.findIndex(p => p.id === currentPlayerId);
        const nextIndex = (currentIndex + gameState.direction + gameState.players.length) % gameState.players.length;
        return gameState.players[nextIndex].id;
    }

    function canPlayCard(card) {
        return card.color === gameState.currentColor || 
               card.value === gameState.currentValue || 
               card.type === 'wild';
    }

    function drawCardFromDeck() {
        if (gameState.deck.length === 0) {
            // Reshuffle discard pile except the top card
            const topCard = gameState.discardPile.pop();
            gameState.deck = [...gameState.discardPile];
            gameState.discardPile = [topCard];
            shuffleDeck(gameState.deck);
        }
        
        return gameState.deck.pop();
    }

    // Generate a complete UNO deck
    function generateDeck() {
        let deck = [];
        
        // Add number cards (0-9), skip, reverse, draw-two
        colors.forEach(color => {
            values.forEach(value => {
                // Add one '0' card for each color
                if (value === '0') {
                    deck.push({ color, value, type: 'number' });
                } else {
                    // Add two of each other card
                    deck.push({ color, value, type: value === 'skip' || value === 'reverse' || value === 'draw-two' ? 'action' : 'number' });
                    deck.push({ color, value, type: value === 'skip' || value === 'reverse' || value === 'draw-two' ? 'action' : 'number' });
                }
            });
        });

        // Add wild cards (4 of each)
        wilds.forEach(value => {
            for (let i = 0; i < 4; i++) {
                deck.push({ color: null, value, type: 'wild' });
            }
        });
        
        // Shuffle the deck
        shuffleDeck(deck);
        
        return deck;
    }

    // Shuffle deck using Fisher-Yates algorithm
    function shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    // Deal initial cards to players
    function dealCards() {
        // Each player gets 7 cards
        gameState.playerHand = [];
        for (let i = 0; i < 7; i++) {
            gameState.playerHand.push(gameState.deck.pop());
        }
        
        // Set up initial discard pile
        gameState.discardPile = [gameState.deck.pop()];
        
        // If the first card is a wild, assign a random color
        if (gameState.discardPile[0].type === 'wild') {
            gameState.discardPile[0].color = colors[Math.floor(Math.random() * colors.length)];
        }
        
        // Set current color and value based on the top card
        gameState.currentColor = gameState.discardPile[0].color;
        gameState.currentValue = gameState.discardPile[0].value;
    }

    // Render player's hand
    function renderPlayerHand() {
        playerHand.innerHTML = '';
        
        gameState.playerHand.forEach((card, index) => {
            const cardElement = createCardElement(card);
            cardElement.dataset.index = index;
            
            // Add drag functionality
            cardElement.setAttribute('draggable', 'true');
            cardElement.addEventListener('dragstart', handleDragStart);
            
            // Add click functionality
            cardElement.addEventListener('click', () => playCard(index));
            
            // Highlight playable cards
            if (gameState.currentPlayer === gameState.playerId && 
                (card.color === gameState.currentColor || 
                 card.value === gameState.currentValue || 
                 card.type === 'wild')) {
                cardElement.classList.add('playable');
            }
            
            playerHand.appendChild(cardElement);
        });
    }

    // Create a card element
    function createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'uno-card';
        
        const cardInner = document.createElement('div');
        cardInner.className = 'card-inner';
        
        const cardFront = document.createElement('div');
        cardFront.className = 'card-front';
        
        if (card.type === 'wild') {
            cardFront.classList.add('card-wild');
            cardFront.textContent = card.value === 'wild' ? '★' : '+4';
        } else {
            cardFront.classList.add(`card-${card.color}`);
            
            // Add symbols for action cards
            if (card.type === 'action') {
                cardFront.classList.add(`card-${card.value}`);
                
                if (card.value === 'skip') {
                    cardFront.textContent = '⊘';
                } else if (card.value === 'reverse') {
                    cardFront.textContent = '↻';
                } else if (card.value === 'draw-two') {
                    cardFront.textContent = '+2';
                }
            } else {
                // Number card
                cardFront.textContent = card.value;
            }
        }
        
        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';
        
        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        cardElement.appendChild(cardInner);
        
        return cardElement;
    }

    // Render discard pile
    function renderDiscardPile() {
        discardPile.innerHTML = '';
        
        if (gameState.discardPile.length > 0) {
            const topCard = gameState.discardPile[gameState.discardPile.length - 1];
            const cardElement = createCardElement(topCard);
            discardPile.appendChild(cardElement);
        }
    }

    // Render other players
    function renderOtherPlayers() {
        otherPlayers.innerHTML = '';
        
        gameState.players.forEach(player => {
            if (player.id !== gameState.playerId) {
                const playerElement = document.createElement('div');
                playerElement.className = 'other-player';
                
                if (player.id === gameState.currentPlayer) {
                    playerElement.classList.add('current-player-highlight');
                }
                
                playerElement.innerHTML = `
                    <div class="font-bold">${player.name}</div>
                    <div class="text-sm">${player.cardCount} cards</div>
                    <div class="other-player-cards">
                        ${Array(player.cardCount).fill('<div class="other-player-card"></div>').join('')}
                    </div>
                `;
                
                otherPlayers.appendChild(playerElement);
            }
        });
    }

    // Update game info
    function updateGameInfo() {
        const currentPlayerName = gameState.players.find(p => p.id === gameState.currentPlayer)?.name || '';
        currentPlayerDisplay.textContent = currentPlayerName;
        cardsLeftDisplay.textContent = gameState.deck.length;
    }

    // Play a card
    function playCard(index) {
        if (gameState.currentPlayer !== gameState.playerId) {
            showToast("It's not your turn!");
            return;
        }
        
        const card = gameState.playerHand[index];
        
        // Check if card can be played
        if (card.color === gameState.currentColor || 
            card.value === gameState.currentValue || 
            card.type === 'wild') {
            
            // Handle wild cards
            if (card.type === 'wild') {
                showColorChooser(index);
                return;
            }
            
            // Remove card from hand
            gameState.playerHand.splice(index, 1);
            
            // Add card to discard pile
            gameState.discardPile.push(card);
            
            // Update current color and value
            gameState.currentColor = card.color;
            gameState.currentValue = card.value;
            
            // Emit play card event
            gameState.socket.emit('play-card', {
                playerId: gameState.playerId,
                card: card
            });
            
            // Check for win condition
            if (gameState.playerHand.length === 0) {
                gameState.socket.emit('game-won', {
                    playerId: gameState.playerId,
                    playerName: gameState.playerName
                });
                showGameOver(gameState.playerName);
            }
            
            // Render game state
            renderGameState();
        } else {
            showToast("You can't play this card!");
        }
    }

    // Draw a card
    function drawCard() {
        if (gameState.currentPlayer !== gameState.playerId) {
            showToast("It's not your turn!");
            return;
        }
        
        gameState.socket.emit('draw-card', {
            playerId: gameState.playerId
        });
    }

    // Show color chooser for wild cards
    function showColorChooser(cardIndex) {
        colorChooser.dataset.cardIndex = cardIndex;
        colorChooser.classList.remove('hidden');
    }

    // Handle color selection for wild cards
    function handleColorSelection(color) {
        const cardIndex = parseInt(colorChooser.dataset.cardIndex);
        const card = gameState.playerHand[cardIndex];
        
        // Set the color of the wild card
        card.color = color;
        
        // Remove card from hand
        gameState.playerHand.splice(cardIndex, 1);
        
        // Add card to discard pile
        gameState.discardPile.push(card);
        
        // Update current color and value
        gameState.currentColor = color;
        gameState.currentValue = card.value;
        
        // Emit play card event
        gameState.socket.emit('play-card', {
            playerId: gameState.playerId,
            card: card,
            color: color
        });
        
        // Hide color chooser
        colorChooser.classList.add('hidden');
        
        // Check for win condition
        if (gameState.playerHand.length === 0) {
            gameState.socket.emit('game-won', {
                playerId: gameState.playerId,
                playerName: gameState.playerName
            });
            showGameOver(gameState.playerName);
        }
        
        // Render game state
        renderGameState();
    }

    // Show game over modal
    function showGameOver(winnerName) {
        winnerText.textContent = `${winnerName} wins!`;
        gameOverModal.classList.remove('hidden');
    }

    // Show toast notification
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Render the entire game state
    function renderGameState() {
        renderPlayerHand();
        renderDiscardPile();
        renderOtherPlayers();
        updateGameInfo();
    }

    // Handle drag and drop functionality
    function handleDragStart(e) {
        if (gameState.currentPlayer !== gameState.playerId) {
            e.preventDefault();
            return;
        }
        
        e.dataTransfer.setData('text/plain', e.target.dataset.index);
        e.target.classList.add('dragging');
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    function handleDragOver(e) {
        e.preventDefault();
    }

    function handleDrop(e) {
        e.preventDefault();
        const cardIndex = e.dataTransfer.getData('text/plain');
        
        if (e.target.closest('#discard-pile')) {
            playCard(parseInt(cardIndex));
        }
    }

    // Event listeners
    function setupEventListeners() {
        // Welcome screen
        createGameBtn.addEventListener('click', () => {
            if (!playerNameInput.value.trim()) {
                showToast('Please enter your name');
                return;
            }
            
            gameState.playerName = playerNameInput.value.trim();
            showScreen('loading');
            gameState.socket.emit('create-game', { playerName: gameState.playerName });
        });
        
        joinGameBtn.addEventListener('click', () => {
            if (!playerNameInput.value.trim()) {
                showToast('Please enter your name');
                return;
            }
            
            gameState.playerName = playerNameInput.value.trim();
            joinModal.classList.remove('hidden');
        });
        
        // Join modal
        cancelJoinBtn.addEventListener('click', () => {
            joinModal.classList.add('hidden');
        });
        
        confirmJoinBtn.addEventListener('click', () => {
            const gameCode = gameCodeInput.value.trim().toUpperCase();
            
            if (!gameCode) {
                showToast('Please enter a game code');
                return;
            }
            
            showScreen('loading');
            gameState.socket.emit('join-game', { 
                gameId: gameCode,
                playerName: gameState.playerName
            });
            
            joinModal.classList.add('hidden');
        });
        
        // Lobby screen
        copyCodeBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(gameState.gameId)
                .then(() => showToast('Game code copied to clipboard!'))
                .catch(err => console.error('Could not copy text: ', err));
        });
        
        startGameBtn.addEventListener('click', () => {
            if (gameState.players.length < 2) {
                showToast('Need at least 2 players to start');
                return;
            }
            
            showScreen('loading');
            gameState.socket.emit('start-game', { gameId: gameState.gameId });
        });
        
        // Game screen
        drawPile.addEventListener('click', drawCard);
        discardPile.addEventListener('dragover', handleDragOver);
        discardPile.addEventListener('drop', handleDrop);
        
        // Color chooser
        colorButtons.forEach(button => {
            button.addEventListener('click', () => {
                handleColorSelection(button.dataset.color);
            });
        });
        
        // Play again button
        playAgainBtn.addEventListener('click', () => {
            gameOverModal.classList.add('hidden');
            showScreen('lobby');
            
            // Reset game state
            gameState.players = gameState.players.map(p => ({ ...p, cardCount: 0 }));
            gameState.deck = [];
            gameState.discardPile = [];
            gameState.playerHand = [];
            
            // Update player list
            renderPlayerList();
            saveGameState();
        });
        
        // Handle page refresh/close
        window.addEventListener('beforeunload', () => {
            saveGameState();
        });
        
        // Socket events
        gameState.socket.on('game-created', data => {
            gameState.gameId = data.gameId;
            gameState.playerId = data.playerId;
            gameState.isHost = data.isHost;
            gameState.players = [{ id: data.playerId, name: gameState.playerName, cardCount: 0 }];
            
            // Show lobby screen
            showScreen('lobby');
            
            // Display game code
            gameCodeDisplay.textContent = gameState.gameId;
            gameCodeDisplayIngame.textContent = gameState.gameId;
            
            // Update player list
            renderPlayerList();
            
            // Show/hide start game button based on host status
            startGameBtn.style.display = gameState.isHost ? 'block' : 'none';
            
            // Save game state
            saveGameState();
        });
        
        gameState.socket.on('game-joined', data => {
            gameState.gameId = data.gameId;
            gameState.playerId = data.playerId;
            gameState.isHost = data.isHost;
            gameState.players = data.players;
            
            // Add self to players if not already there
            if (!gameState.players.find(p => p.id === gameState.playerId)) {
                gameState.players.push({ 
                    id: gameState.playerId, 
                    name: gameState.playerName,
                    cardCount: 0
                });
            }
            
            // Show lobby screen
            showScreen('lobby');
            
            // Display game code
            gameCodeDisplay.textContent = gameState.gameId;
            gameCodeDisplayIngame.textContent = gameState.gameId;
            
            // Update player list
            renderPlayerList();
            
            // Show/hide start game button based on host status
            startGameBtn.style.display = gameState.isHost ? 'block' : 'none';
            
            // Notify other players
            if (!gameState.isHost) {
                gameState.socket.emit('player-joined', {
                    gameId: gameState.gameId,
                    playerId: gameState.playerId,
                    playerName: gameState.playerName
                });
            }
            
            // Save game state
            saveGameState();
        });
        
        gameState.socket.on('lobby-reconnected', data => {
            gameState.players = data.players;
            
            // Show lobby screen
            showScreen('lobby');
            
            // Display game code
            gameCodeDisplay.textContent = gameState.gameId;
            gameCodeDisplayIngame.textContent = gameState.gameId;
            
            // Update player list
            renderPlayerList();
            
            // Show/hide start game button based on host status
            startGameBtn.style.display = gameState.isHost ? 'block' : 'none';
        });
        
        gameState.socket.on('game-reconnected', data => {
            gameState.players = data.players;
            gameState.deck = data.deck;
            gameState.currentPlayer = data.currentPlayer;
            gameState.currentColor = data.currentColor;
            gameState.currentValue = data.currentValue;
            
            // Deal cards
            dealCards();
            
            // Show game screen
            showScreen('game');
            
            // Render game state
            renderGameState();
        });
        
        gameState.socket.on('player-joined', data => {
            // Add new player to the list
            if (!gameState.players.find(p => p.id === data.player.id)) {
                gameState.players.push(data.player);
                
                // Update player list
                renderPlayerList();
                
                // Show toast
                showToast(`${data.player.name} joined the game!`);
            }
        });
        
        gameState.socket.on('game-started', data => {
            gameState.deck = data.deck;
            gameState.players = data.players;
            gameState.currentPlayer = data.currentPlayer;
            gameState.currentColor = data.currentColor;
            gameState.currentValue = data.currentValue;
            
            // Deal cards
            dealCards();
            
            // Show game screen
            showScreen('game');
            
            // Render game state
            renderGameState();
        });
        
        gameState.socket.on('card-played', data => {
            // Update game state
            gameState.currentPlayer = data.nextPlayer;
            gameState.currentColor = data.nextColor;
            gameState.currentValue = data.card.value;
            
            // Update discard pile
            gameState.discardPile.push(data.card);
            
            // Update player card count
            const playerIndex = gameState.players.findIndex(p => p.id === data.playerId);
            if (playerIndex !== -1) {
                gameState.players[playerIndex].cardCount = data.remainingCards;
            }
            
            // Check for win condition
            if (data.remainingCards === 0) {
                const playerName = gameState.players.find(p => p.id === data.playerId)?.name || 'Unknown';
                showGameOver(playerName);
            }
            
            // Render game state
            renderGameState();
        });
        
        gameState.socket.on('card-drawn', data => {
            if (data.playerId === gameState.playerId) {
                // Add card to player's hand
                gameState.playerHand.push(data.card);
            } else {
                // Update other player's card count
                const playerIndex = gameState.players.findIndex(p => p.id === data.playerId);
                if (playerIndex !== -1) {
                    gameState.players[playerIndex].cardCount++;
                }
            }
            
            // Update deck count
            gameState.deck.pop();
            
            // Update current player
            gameState.currentPlayer = data.nextPlayer;
            
            // Render game state
            renderGameState();
        });
        
        gameState.socket.on('error', data => {
            showToast(data.message);
            showScreen('welcome');
        });
    }

    // Render player list in lobby
    function renderPlayerList() {
        playerList.innerHTML = '';
        
        gameState.players.forEach(player => {
            const li = document.createElement('li');
            li.className = 'py-2 flex items-center';
            
            if (player.id === gameState.playerId) {
                li.innerHTML = `
                    <span class="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    <span>${player.name} (You)</span>
                `;
            } else {
                li.innerHTML = `
                    <span class="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    <span>${player.name}</span>
                `;
            }
            
            playerList.appendChild(li);
        });
    }

    // Initialize the game
    function init() {
        // Show loading screen initially
        showScreen('loading');
        
        // Initialize socket connection
        initializeSocket();
        
        // Set up event listeners
        setupEventListeners();
        
        // Check for saved game state
        if (loadGameState()) {
            // Try to reconnect to existing game
            reconnectToGame();
        } else {
            // Show welcome screen if no saved game
            showScreen('welcome');
        }
    }

    // Start the game
    init();
});
