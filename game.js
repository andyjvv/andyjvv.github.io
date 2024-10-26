export class FarmGame {
    constructor() {
        this.state = {
            tree: {
                age: 0,
                growthStage: 'seedling',
                fruits: 0
            },
            power: {
                connected: false,
                voltage: 0
            },
            wallet: {
                connected: false,
                balance: 0
            }
        };
        
        this.tronManager = {
            balance: 0,
            exchangeRate: 0.08,
            connected: false,
            withdrawalHistory: [],
            
            getTronExchangeRate: async function() {
                return this.exchangeRate;
            }
        };

        // Iniciar el crecimiento del árbol
        setInterval(() => this.grow(), 1000);
    }

    async initializeTron() {
        // Simulación de inicialización de TRON
        this.tronManager.connected = true;
        return true;
    }

    connectUSB() {
        this.state.power.connected = true;
        this.state.power.voltage = 5;
        return true;
    }

    async connectWallet() {
        this.state.wallet.connected = true;
        this.state.wallet.balance = 100; // Balance inicial para pruebas
        return true;
    }

    grow() {
        if (!this.state.power.connected) return;

        this.state.tree.age++;
        
        // Lógica de crecimiento
        if (this.state.tree.age > 50) {
            this.state.tree.growthStage = 'fruit_bearing';
            if (this.state.tree.fruits < 10) {
                this.state.tree.fruits += Math.random() > 0.8 ? 1 : 0;
            }
        } else if (this.state.tree.age > 40) {
            this.state.tree.growthStage = 'mature_tree';
        } else if (this.state.tree.age > 30) {
            this.state.tree.growthStage = 'young_tree';
        } else if (this.state.tree.age > 20) {
            this.state.tree.growthStage = 'sapling';
        }
    }

    harvestFruits() {
        const harvested = this.state.tree.fruits;
        this.state.tree.fruits = 0;
        return harvested;
    }

    async sellFruits(amount) {
        const pricePerFruit = 1.5;
        const revenue = amount * pricePerFruit;
        this.state.wallet.balance += revenue;
        return revenue;
    }

    getGameState() {
        return this.state;
    }

    getTronBalance() {
        return this.tronManager.balance;
    }

    async swapToTron(usdAmount) {
        if (usdAmount > this.state.wallet.balance) {
            throw new Error('Balance USD insuficiente');
        }

        const rate = await this.tronManager.getTronExchangeRate();
        const tronAmount = usdAmount / rate;
        
        this.state.wallet.balance -= usdAmount;
        this.tronManager.balance += tronAmount;

        return {
            success: true,
            amount: tronAmount
        };
    }

    async swapFromTron(tronAmount) {
        if (tronAmount > this.tronManager.balance) {
            throw new Error('Balance TRX insuficiente');
        }

        const rate = await this.tronManager.getTronExchangeRate();
        const usdAmount = tronAmount * rate;
        
        this.tronManager.balance -= tronAmount;
        this.state.wallet.balance += usdAmount;

        return {
            success: true,
            amount: usdAmount
        };
    }

    async withdrawTron(amount, address) {
        if (amount > this.tronManager.balance) {
            throw new Error('Balance insuficiente para retirar');
        }

        // Simular transacción
        const txHash = 'Tx_' + Math.random().toString(36).substr(2, 9);
        
        this.tronManager.balance -= amount;
        this.tronManager.withdrawalHistory.unshift({
            amount,
            address,
            txHash,
            timestamp: new Date()
        });

        return {
            success: true,
            txHash
        };
    }

    getWithdrawalHistory() {
        return this.tronManager.withdrawalHistory;
    }
}