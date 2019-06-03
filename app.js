const secret = require('./data/secret')
console.log(secret.user_id)
const scope = ['activity', 'nutrition', 'heartrate', 'location', 'nutrition', 'profile', 'settings', 'sleep', 'social', 'weight'].join(' ')
const distant = 's.florianpellet.com/fitbit/'
const api_version = '1.2'
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


class Server {
    constructor () {
        this.http = require('http')
        this.host = 'localhost'
        this.port = 3000
        this.server = this.getServer()
        this.states = {}
        this.tunnel
        this.ready = false

        this.start = this.start.bind(this)
        this.getPort = this.getPort.bind(this)
        this.getServer = this.getServer.bind(this)
        this.getTunnel = this.getTunnel.bind(this)
        this.resolveOn = this.resolveOn.bind(this)
    }

    start() {
        const self = this
        return new Promise((resolve, reject) => {
            self.getPort(self.port)
            .then((port) => {
                self.port = port
                self.server.listen(port, self.host, () => resolve(port))
            })
            .catch(reject)
        })
    }

    // find port by iterating on 'EADDRINUSE' errors starting at `port` argument until one is available
    getPort(port) {
        const self = this
        const server = self.http.createServer()
        return new Promise((resolve, reject) => server
            .on('error', error => error.code === 'EADDRINUSE' ? server.listen(++port, self.host) : reject(error))
            .on('listening', () => server.close(() => {
                console.log(`found port ${port} available for host ${self.host}`)
                resolve(port)
            }))
            .listen(port, self.host)
        )
    }

    getServer() { 
        const self = this
        return self.http.createServer(async (req, res) => {

            let response = 'thanks'
            
            // parse request
            const data = {}
            if(req.url.includes('?'))
                req.url
                    .split('?')[1]
                    .split('&')
                    .map(item => item.split('='))
                    .forEach(([key, value]) => {
                        console.log(`server received ${key} => ${value}`)
                        data[key] = value
                    })
                    // .forEach(([key, value]) => data[key] = value)
            
            if(data.test)
                console.log(data.test)

            // handle redirected promises
            if(data.state && self.states[data.state]) {
                self.states[data.state](data)
                delete self.states[data.state]
            }
            //handle in-app requests
            else if (this.ready) {
                switch (req.url) {
                    case '/calories':
                        response = await calories()
                        break;
                }
            }
            
            // send some standard response (necessary ?)
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/plain')
            res.end(response)
        })
    }

    getTunnel (dstnt) {
        const self = this
        function startTunnel () {
            return new Promise(async (resolve, reject) => {
                console.log(`starting tunnel on port: ${self.port}`)
                
                const ngrok = require('ngrok');
                try {
                    const url = await ngrok.connect(self.port)
                    resolve(url)
                } catch { 
                    reject('couldnt open a tunnel')
                }
            })  
        }

        function registerRemote (url) {
            return new Promise((resolve, reject) => {
                self.http.get(`http://${dstnt}?tunnel=${url}`, (res) => {
                    if (res.statusCode !== 200)
                        return reject(res)
                    console.log(`tunnel registered through ${url}`)
                    self.tunnel = url
                    resolve(url)
                }).on('error', (e) => console.error(`Got error registering tunnel @ ${url}: ${e.message}`))
            })  
        }

        function ping () {
            if(!self.tunnel)
                return Promise.reject('')
            return new Promise((resolve, reject) => {
                console.log(`pinging tunnel @ ${self.tunnel}`)
                self.server.resolveOn('ping', () => resolve(self.tunnel), reject, 10000)
                self.http.get(`http://${dstnt}?ping=1`, (res) => {
                    if (res.statusCode !== 200) {
                        console.error(`Got error pinging server @ http://${dstnt}?ping: ${res}`)
                        reject(res)                        
                    }
                }).on('error', (e) => {
                    console.error(`Got error pinging tunnel @ ${self.tunnel}: ${e.message}`)
                    reject(e)
                })
            })
        }

        return new Promise((resolve, reject) => {
            ping()
            .then(resolve)
            .catch(() => {
                startTunnel()
                .then(registerRemote)
                .then(resolve)
                .catch(reject)
            })
        }) 
    }

    resolveOn(state, resolve, reject = () => {}, timeout = 0) {
        const self = this
        console.log(`waiting for ${state} state through tunnel @ ${self.tunnel}`)
        const timeoutID = setTimeout(() => reject(`request for ${state} through ${self.tunnel} timed out`), timeout)
        self.states[state] = (args) => {
            clearTimeout(timeoutID)
            resolve(args)
        }
    }
}

class Token {
    constructor(server) {
        this.fs = require('fs')
        this.token
        this.server = server

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
                const parsedResolution = (data) => resolve(data.code)
                self.server.getTunnel(distant)
                .then(() => {
                    self.server.resolveOn('initial_code', parsedResolution, reject, 100000)
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
            self.fs.readFile('data/token.json', 'utf8', function(err, json) {
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
        self.fs.writeFile('data/token.json', JSON.stringify(token.token), 'utf8', (err) => {
            if (err) 
                console.error(err)
        })
    }
}


function getActivity(token) {
    return new Promise((resolve, reject) => {
        const https = require('https')
        const date = new Date().toISOString().slice(0,10)
        const path = `activities/date/${date}.json`
        const url = `https://api.fitbit.com/${api_version}/user/${secret.user_id}/${path}`
        console.log(`getting data from ${url}`)
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${token.token.access_token}`
            }
        }
        
        const request = https.request(url, options,function(res){
            let rawData = '';
            res.on('data', chunk => rawData += chunk)
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData)
                    if(parsedData.errors)
                        reject(parsedData)
                    else
                        resolve(parsedData)
                } catch (e) {
                    reject(e.message)
                }
            })
        })
        request.end();
    })
}


const server = new Server()
const token = new Token(server)
server.start()
.then(token.get)
.then(async token => {
    server.ready = true
    console.log('ready')

    console.log(`TOTAL EXPENDED CALORIES: ${await calories()}`)


})
.catch((e) => {
    console.error('WTF ?!', e)
})


// TODO: somehow, getActivity works inside the initial server.start but not when called inside the server itself... (see switch statement commented out in server class)

async function calories () {
    return await token.get()
        .then(getActivity)
        .then(data => data.summary.calories.total)
        .catch('got a dud')
}


