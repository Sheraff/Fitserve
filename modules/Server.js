class Server {
    constructor () {
        this.http = require('http')
        this.host = '127.0.0.1'
        this.port = 3000
        this.server
        this.states = {}
        this.tunnel

        this.sockets = {}
        this.nextSocketId = 0

        this.start = this.start.bind(this)
        this.createServer = this.createServer.bind(this)
        this.getPort = this.getPort.bind(this)
        this.getTunnel = this.getTunnel.bind(this)
        this.resolveOn = this.resolveOn.bind(this)
    }

    start(callback) {
        const self = this

        if(callback)
            self.server = self.http.createServer(callback)
        if(!self.server)
            return Promise.reject('you must either call Server.createServer before, or you have to call Server.start with a callback argument')

        // used to prooperly kill the server once we don't need it
        self.server.on('connection', function (socket) {
            const socketId = self.nextSocketId++
            self.sockets[socketId] = socket
            socket.on('close', () => delete self.sockets[socketId])
        })

        return new Promise((resolve, reject) => {
            self.getPort(self.port)
            .then((port) => {
                self.port = port
                self.server.listen(port, self.host, () => resolve(port))
            })
            .catch(reject)
        })
    }

    createServer(callback) {
        const self = this
        if(self.server)
            return Promise.reject('you cant change the servers callback once it has already started listening')
        self.server = self.http.createServer(callback)
        return Promise.resolve()
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

    parseGetRequest(req) {
        const data = {}
        if(req.url.includes('?'))
            req.url
            .split('?')[1]
            .split('&')
            .map(item => item.split('='))
            .forEach(([key, value]) => data[key] = value)
        return data
    }

    close() {
        this.server.close(() => console.log('Server closed!'))
        for (const socketId in this.sockets) {
            this.sockets[socketId].destroy()
        }
    }
}

module.exports = Server