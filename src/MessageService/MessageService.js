const TGMessenger = require('./TGMessenger')
const ConsoleMessenger = require('./ConsoleMessenger')

class MessageService {
    constructor () {
        this._messengers = []
        this._initialized = false
    }

    _init (config) {
        if (this._initialized) return
        this._messengers.push(new TGMessenger(config))
        this._messengers.push(new ConsoleMessenger(config))
        this._initialized = true
    }

    sendMessage (message) {
        const msg = typeof message === 'string' ? message : (message && message.message) || JSON.stringify(message)
        this._messengers.forEach(x => x.sendMessage(msg))
    }

}

module.exports = new MessageService()