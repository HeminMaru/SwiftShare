const express = require("express");
const path = require("path");

const app = express();
const server = require("http").createServer(app);

const io = require("socket.io")(server);

app.use(express.static(path.join(__dirname+"/public")));

io.on("connection", function(socket){
	socket.on("sender-join",function(data){
		socket.join(data.uid);

	});
	socket.on("receiver-join",function(data){
		socket.join(data.uid);
		socket.in(data.sender_uid).emit("init", data.uid);
		//socket.in(data.sender_uid).emit("receiver-join-rtc", data);
	});
	socket.on("transfer_SDP",async function(data){
		await socket.in(data.receiverID).emit("offer", data.sdp);
	});
	socket.on("transfer_ANS",async function(data){
		await socket.in(data.sender_uid).emit("answer", data.ans);
	});
	socket.on("transfer_sender_candidate",async function(data){
		await socket.in(data.sender_uid).emit("candidate", {
			candidate:data.candidate,
			label : data.label
		});
	});
	socket.on("transfer_reciever_candidate",async function(data){
		await socket.in(data.receiverID).emit("candidate", {
			candidate:data.candidate,
			label:data.label
		});
	});
	socket.on("file-meta",function(data){
		socket.in(data.uid).emit("fs-meta", data.metadata);
	});
	socket.on("fs-start",function(data){
		socket.in(data.uid).emit("fs-share", {});
	});
	socket.on("file-raw",function(data){
		socket.in(data.uid).emit("fs-share", data.buffer);
	})
});

server.listen(4312);