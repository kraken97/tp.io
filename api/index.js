var WebSocketServer = new require('ws');
const spawn = require('child_process').spawn;
const fs = require('fs');
// подключенные клиенты
var clients = {};

// WebSocket-сервер на порту 8081n
var webSocketServer = new WebSocketServer.Server({
    port: 8082
});
let docker;
let dockerid;
webSocketServer.on('connection', function (ws) {

    var id = Math.random();

    console.log("новое соединение " + id);

    ws.on('message', function (message) {
        console.log('получено сообщение ' +message);
        const msg = JSON.parse(message);
        msg.files.forEach(el=>{
            fs.writeFileSync('../workdir/'+el.name, el.value);
        })
        const code = Math.random().toString();
        dockerid = code;
        docker =  spawn('docker',['build','-t', code,'../workdir'])
       docker.stderr.on('data',(data)=>{
           ws.send(data.toString());
               console.log(data.toString())
       })
           docker.stdout.on('data', (data) => {
               ws.send(data.toString());
               console.log(data.toString())
           })
           docker.stdio.forEach( el =>{
               el.on('close', ()=>{
                   spawn('docker', ['rmi', '-f', dockerid])
               })
           })
    });

    ws.on('close', function () {
        docker.kill();
        console.log('соединение закрыто ' + id);
        spawn('docker', ['rmi', '-f', dockerid])
        delete clients[id];
    });

});