const { app,APIResponse} = require('../src/app');
const request = require('supertest');
const expect = require('chai').expect;

before(function(done){
    this.timeout(5000);
    setTimeout(done,4000);
})
console.log("Frontend Unit Testing:")
describe("POST log users in", () => {
    const tempUser='{"email": "vatsalshah1902@gmail.com","password": "123"}';
    const tempUser1='{"email": "vatsalshah1902@gmail.com","password": "12394"}';
    const jsonobj=JSON.parse(tempUser);
    const jsonobj1=JSON.parse(tempUser1);
    it("should log a user with valid credentials", (done) => {
      request(app)
        .post("/login")
        .send(jsonobj)
        .expect(201)
        .then((res) => {
          expect(res !=null).equal(true);
          done();
        })
        .catch((err) => done(err));
    });
    it("should give error when user enters invalid password", (done) => {
        request(app)
          .post("/login")
          .send(jsonobj1)
          .expect(200)
          .then((res) => {
            expect(res.text).to.equal("invalid password");
            done();
          })
          .catch((err) => done(err));
      });
});
describe("POST register users into database", () => {
    
    const tempUser1='{"username": "newuser@gmail.com","password": "123456"}';
    const obj1=JSON.parse(tempUser1);
    it("should register a new user", (done) => {
        request(app)
          .post("/register")
          .send(obj1)
          .expect(201)
          .then((res) => {
              expect(res != null).equal(true);
            done();
          })
          .catch((err) => done(err));
      });
      const tempUserS='{"username":"vatsalshah1902@gmail.com","password":"123"}';
    const obj=JSON.parse(tempUserS);
    //console.log(UserJSON);
    it("shouldn't accept the username that already exists in the database", (done) => {
      request(app)
        .post("/register")
        .send(obj)
        .expect(400)
        .then((res) => {
            console.log("Error Code: "+res.body.code);
            expect(res.body.code==11000).equal(true);
          done();
        })
        .catch((err) => done(err));
    });
});
console.log("Backend Unit Testing:")
describe('Calling text generation API', function(){
    it('should generate a text from api call', async()=>{
        let category= "history";
        let res= await APIResponse(category);
        console.log("Text generated: "+res.value);
        expect(res != null).equal(true);
    });
});
const http = require("http").createServer(app);
var io = require('socket.io-client')(http);

var socketURL = 'http://0.0.0.0:3000';
var options ={
  transports: ['websocket'],
  'force new connection': true
};

describe('Sockets', function () {  
    var client1, client2, client3;
    it('should host a room', () => {
        client3=io.connect(socketURL,options);
        client3.on('chat-message', function(msg){
            expect(msg).to.equal('test');
            client3.disconnect();
        });
        client3.on('connect', function(){
            client3.emit('hostingAGame', ("VATSAL-6","VATSAL","VATSAL"));
      
            // Set up client2 connection
           client3.emit('chat-message',"test");
      
          });
    });
    it('should join a room', function () {  

        // Set up client1 connection
        client1 = io.connect(socketURL, options);
    
        
        
        client1.on('connect', function(){
          client1.on('joiningAGame', ("VATSAL-6","VATSAL","VATSAL"));
          
          // Set up client2 connection
          client2 = io.connect(socketURL, options);
          
          client2.on('connect', function(){
            
            // Emit event when all clients are connected.
            client2.on('joiningAGame', ("VATSAL-0","KRUTIK","KRUTIK"));
            client2.emit('chat-message', 'test');
          });
          
          // Set up event listener.  This is the actual test we're running
          client1.on('send-chat-message', function(msg){
            expect(msg).to.equal('test');
      
            // Disconnect both client connections
            client1.disconnect();
            client2.disconnect();
          });
    
        });
      });

    // testing goodness goes here
  });
describe('Socket-Connections', () => {
  it('should connect to sockets', () => {
    console.log("1");
    io.on("connection",(socket)=>{
      console.log("2");
      socket.on("disconnection",()=>{
        console.log(socket.playerName);
      })
      console.log("3");
      var status = socket.on("joiningAGame",("VATSAL-6","VATSAL","VATSAL"))
      console.log("status: "+status, "Room ID"+socket.roomName)
      expect(status).to.equal('roomExists')
    })
  });
});
describe('Socket-Chats',()=>{
    it('Should send message', (done)=>{
        const msg="test string";
        const client1 = io.connect(socketURL)
        client1.on('connect', ()=>{
            client1.emit('new-user-joined', ("vatsal") )
            const client2 = io.connect(socketURL,options)
            client2.on('connect',()=>{
                client2.emit('new-user-joined', ("vats") )
                client1.emit('send-message', msg)
                client2.on('receive-message', (res)=>{
                    expect(res.message).to.equal('test string')
                })
            })
        })
        done();
    })
})
after(function(done){
  this.timeout(60000)
  setTimeout(done,50000)
  process.exit();
});