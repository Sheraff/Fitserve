const scope = ['activity', 'nutrition', 'heartrate', 'location', 'nutrition', 'profile', 'settings', 'sleep', 'social', 'weight'].join(' ')
const distant = 's.florianpellet.com/fitbit/'
const secret = require('../data/secret')
const oauth2 = require('simple-oauth2').create({
    client: {
        id: secret.client_id,
        secret: secret.client_secret
    },
    auth: {
        tokenHost: 'https://api.fitbit.com/',
        tokenPath: 'oauth2/token',
        revokePath: 'oauth2/revoke',
        authorizeHost: 'https://www.fitbit.com/',
        authorizePath: 'oauth2/authorize'
    }
})
const Server = require('./Server')

class Token {
    constructor() {
        this.fs = require('fs')
        this.token

        this.get = this.get.bind(this)
        this.oauth = this.oauth.bind(this)
        this.refresh = this.refresh.bind(this)
        this.read = this.read.bind(this)
        this.store = this.store.bind(this)
    }

    get() {
        const self = this
        function local() {
            return new Promise((resolve, reject) => {
                self.read()
                .then((token) => {
                    if(token.expired())
                        reject()
                    else
                        resolve(token)
                })
                .catch(reject)
            })    
        }

        return new Promise((resolve, reject) => {
            local()
            .then(resolve)
            .catch(() => {
                self.refresh()
                .then(resolve)
                .catch(() => {
                    self.oauth()
                    .then(resolve)
                    .catch(reject)
                })
            })
        })
    }

    oauth() {
        const open = require('opn')
        const self = this

        function getCode() {
            return new Promise((resolve, reject) => {

                const server = new Server()
                const timeoutID = setTimeout(() => reject(`request for code timed out`), 100000)
                const resolveOnResponse = (req, res) => {
                    clearTimeout(timeoutID)
                    const data = server.parseGetRequest(req)
                    resolve(data.code)
                    res.statusCode = 200
                    res.end()
                    server.close()
                }
                server.start(resolveOnResponse)
                .then(server.getTunnel.bind(server, distant))
                .then(() => {
                    open(oauth2.authorizationCode.authorizeURL({
                        scope,
                        redirect_uri: `https://${distant}`,
                        state: 'initial_code'
                    }))
                })
            }) 
        }

        function getToken(code) {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await oauth2.authorizationCode.getToken({
                        code,
                        redirect_uri: `https://${distant}`,
                        state: 'initial_token'
                    })
                    const token = oauth2.accessToken.create(result)
                    console.log(`obtained token valid for ${Math.round(token.token.expires_in/60)} minutes`)
                    self.store(token)
                    resolve(token)
                } catch {
                    reject()
                }
            })
        }

        return new Promise((resolve, reject) => {
            getCode() 
            .then(getToken)
            .then(resolve)
            .catch(reject)
        })
    }

    refresh() {
        const self = this
        return new Promise((resolve, reject) => {
            self.read()
            .catch(reject)
            .then(async token => {
                try {
                    token = await token.refresh()
                    store(token)
                    resolve(token)
                } catch {
                    reject()
                }
            })
        })
    }

    read() {
        const self = this
        if(self.token)
            return Promise.resolve(self.token)

        return new Promise((resolve, reject) => {
            self.fs.readFile(__dirname+'/../data/token.json', 'utf8', function(err, json) {
                if (err) 
                    return reject()
                json = JSON.parse(json)
                delete json.expires_in
                const token = oauth2.accessToken.create(json)
                self.token = token
                resolve(token)
            })
        })
    }

    async store(token) {
        const self = this
        self.token = token
        self.fs.writeFile(__dirname+'/../data/token.json', JSON.stringify(token.token), 'utf8', (err) => {
            if (err) 
                console.error(err)
        })
    }
}

module.exports = Token