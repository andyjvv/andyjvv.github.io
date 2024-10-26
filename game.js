// Clase para manejar las operaciones con TRON
class TronManager {
  constructor() {
    this.tronWeb = null;
    this.contractAddress = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"; // Contrato de USDT en TRON
    this.contract = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Verificar si TronLink está instalado
      if (window.tronWeb) {
        this.tronWeb = window.tronWeb;
        this.contract = await this.tronWeb.contract().at(this.contractAddress);
        this.initialized = true;
        return true;
      }
      throw new Error('Por favor instala TronLink');
    } catch (error) {
      console.error('Error inicializando TronManager:', error);
      return false;
    }
  }

  async getBalance(address) {
    try {
      if (!this.initialized) await this.initialize();
      const balance = await this.tronWeb.trx.getBalance(address);
      return this.tronWeb.fromSun(balance);
    } catch (error) {
      console.error('Error obteniendo balance:', error);
      return 0;
    }
  }

  async swap(amount, fromGameCurrency = true) {
    try {
      if (!this.initialized) await this.initialize();
      
      // Obtener tasa de cambio actual desde un oráculo
      const rate = await this.getTronExchangeRate();
      
      // Calcular cantidad de TRX
      const trxAmount = fromGameCurrency ? amount * rate : amount / rate;
      
      // Crear transacción
      const transaction = await this.contract.swap(
        this.tronWeb.toSun(trxAmount),
        fromGameCurrency
      ).send({
        feeLimit: 100000000,
        callValue: 0,
        shouldPollResponse: true
      });

      // Verificar transacción
      const receipt = await this.tronWeb.trx.getTransaction(transaction);
      if (receipt.ret[0].contractRet === 'SUCCESS') {
        return {
          success: true,
          amount: trxAmount,
          txHash: transaction
        };
      }
      throw new Error('Transacción fallida');
    } catch (error) {
      console.error('Error en swap:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async withdraw(amount, address) {
    try {
      if (!this.initialized) await this.initialize();
      
      // Verificar balance
      const balance = await this.getBalance(this.tronWeb.defaultAddress.base58);
      if (balance < amount) {
        throw new Error('Balance insuficiente');
      }

      // Crear transacción de retiro
      const transaction = await this.tronWeb.trx.sendTransaction(
        address,
        this.tronWeb.toSun(amount)
      );

      if (transaction.result) {
        return {
          success: true,
          txHash: transaction.txid,
          amount: amount
        };
      }
      throw new Error('Retiro fallido');
    } catch (error) {
      console.error('Error en retiro:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getTronExchangeRate() {
    try {
      // Obtener precio desde un oráculo confiable (ejemplo con Chainlink)
      const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=TRXUSDT');
      const data = await response.json();
      return parseFloat(data.price);
    } catch (error) {
      console.error('Error obteniendo tasa de cambio:', error);
      return 1; // Valor por defecto en caso de error
    }
  }
}

// Extender la clase FarmGame con funcionalidad de TRON
class FarmGameWithTron extends FarmGame {
  constructor() {
    super();
    this.tronManager = new TronManager();
    this.tronBalance = 0;
    this.withdrawalHistory = [];
  }

  async initializeTron() {
    return await this.tronManager.initialize();
  }

  async swapToTron(amount) {
    if (amount > this.wallet.balance) {
      throw new Error('Balance insuficiente');
    }

    const result = await this.tronManager.swap(amount, true);
    if (result.success) {
      this.wallet.balance -= amount;
      this.tronBalance += result.amount;
      return result;
    }
    throw new Error(result.error);
  }

  async swapFromTron(amount) {
    if (amount > this.tronBalance) {
      throw new Error('Balance TRX insuficiente');
    }

    const result = await this.tronManager.swap(amount, false);
    if (result.success) {
      this.tronBalance -= amount;
      this.wallet.balance += result.amount;
      return result;
    }
    throw new Error(result.error);
  }

  async withdrawTron(amount, address) {
    if (amount > this.tronBalance) {
      throw new Error('Balance TRX insuficiente');
    }

    const result = await this.tronManager.withdraw(amount, address);
    if (result.success) {
      this.tronBalance -= amount;
      this.withdrawalHistory.push({
        amount,
        address,
        timestamp: new Date(),
        txHash: result.txHash
      });
      return result;
    }
    throw new Error(result.error);
  }

  getWithdrawalHistory() {
    return this.withdrawalHistory;
  }

  getTronBalance() {
    return this.tronBalance;
  }
}

export { FarmGameWithTron as FarmGame };
