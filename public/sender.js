(function(){
	let receiverID;
	let socket = io();
	
	var isChannelReady = false;
	var isStarted = false;
	var myPeerConnection;
	var turnReady;
	var datachannel;
	var filename;

	function generateID(){
		return `${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}`;
	}

	document.querySelector("#sender-start-con-btn").addEventListener("click",function(){
		let joinID = generateID();
		document.querySelector("#join-id").innerHTML = `
			<b>Room ID</b>
			<span>${joinID}</span>
		`;
		try{
			socket.emit("sender-join", {
				uid:joinID
			});
			
		}catch(err){
			console.log(err)
		}
		
	});

	socket.on("init",function(uid){
		receiverID = uid;
		isChannelReady = true;
		console.log("reciever joined");
		maybeStart();
		document.querySelector(".join-screen").classList.remove("active");
		document.querySelector(".fs-screen").classList.add("active");
	});

	// socket.on('offer',function(message){
	// 	if (!isStarted) {
	// 		maybeStart();
	// 	}
	// 	myPeerConnection.setRemoteDescription(new RTCSessionDescription(message));
	// 	doAnswer();
	// });
	socket.on('answer',async function(message) {
		console.log("Sender Answer print : ",message);
		if(isStarted){
			await myPeerConnection.setRemoteDescription(new RTCSessionDescription(message))
			console.log(datachannel)

		}
	}); 
	socket.on('candidate',function(message){
		console.log("hereeeeeeeeeeee");
		var candidate = new RTCIceCandidate({
			sdpMLineIndex: message.label,
			candidate: message.candidate
		  });
		  myPeerConnection.addIceCandidate(candidate);
	});

	const downloadFile = (blob, fileName) => {
		const a = document.createElement('a');
		const url = window.URL.createObjectURL(blob);
		a.href = url;
		a.download = fileName;
		a.click();
		window.URL.revokeObjectURL(url);
		a.remove()
	};

	const iceServers = [{"urls":"stun:stun.relay.metered.ca:80"},{"urls":"turn:a.relay.metered.ca:80","username":"124310a1bbd25d1ed27c1112","credential":"iFgghItekDQWISJO"},{"urls":"turn:a.relay.metered.ca:80?transport=tcp","username":"124310a1bbd25d1ed27c1112","credential":"iFgghItekDQWISJO"},{"urls":"turn:a.relay.metered.ca:443","username":"124310a1bbd25d1ed27c1112","credential":"iFgghItekDQWISJO"},{"urls":"turn:a.relay.metered.ca:443?transport=tcp","username":"124310a1bbd25d1ed27c1112","credential":"iFgghItekDQWISJO"}]

	async function maybeStart() {
		console.log("started")
		if (!isStarted && isChannelReady) {
			// Creating peer connection 
			myPeerConnection = new RTCPeerConnection({
				iceServers: iceServers
				});
		
		myPeerConnection.onicecandidate = handleIceCandidate;
		isStarted = true;
		let offer = await myPeerConnection.createOffer();
		console.log(offer);
		await myPeerConnection.setLocalDescription(offer);
		socket.emit('transfer_SDP',{
			receiverID:receiverID,
			sdp:offer
		});
		
		datachannel = myPeerConnection.createDataChannel("filetransfer");
		console.log("data channel created",datachannel);
		console.log(myPeerConnection.localDescription);
		console.log(myPeerConnection.remoteDescription);
		datachannel.onopen =  (event) => {
			datachannel.send("oferer sent:THIS")
		}
		datachannel.onmessage =  (event)=> {
			console.log("The oferrer received a message"+event.data);
		}
		datachannel.onerror = (error) => {
			console.log("Data Channel Error:", error);
		}
		datachannel.onclose = () => {
			console.log("Data Channel closed");``
		};


		}
	}

	function handleIceCandidate(event) {
		console.log('icecandidate event: ', event);
		if (event.candidate) {
			socket.in(receiverID).emit('candidate',{
				type: 'candidate',
				label: event.candidate.sdpMLineIndex,
				id: event.candidate.sdpMid,
				candidate: event.candidate.candidate
			});
		} else {
			console.log('End of candidates.');
		}
	}

	function handleCreateOfferError(event) {
		console.log('createOffer() error: ', event);
	}
							
	//Function to create answer for the received offer
	function doAnswer() {
		console.log('Sending answer to peer.');
		myPeerConnection.createAnswer().then(
			setLocalAndSendMessage,
			onCreateSessionDescriptionError
		);
	}

	

	function onCreateSessionDescriptionError(error) {
		trace('Failed to create session description: ' + error.toString());
	}
	
	var file;
	if(document.querySelector("#file-input")){
		document.querySelector("#file-input").addEventListener("change",function(e){
		var file = e.target.files[0];
		if(!file){
			return;		
		}
		let reader = new FileReader();
		reader.onload = async function(e){
			let buffer = new Uint8Array(reader.result);
			let el = document.createElement("div")
			el.classList.add("item");
			el.innerHTML = `
				<div class="progress">0%</div>
				<div class="filename">${file.name}</div>
			`;
			document.querySelector(".files-list").appendChild(el);
			console.log("Share file");
			if (file) {
			console.log("reched")
			datachannel.send(file.name);
			const arrayBuffer = await file.arrayBuffer();
			console.log(arrayBuffer)
			for (let i = 0; i < arrayBuffer.byteLength; i += MAXIMUM_MESSAGE_SIZE) {
				datachannel.send(arrayBuffer.slice(i, i + MAXIMUM_MESSAGE_SIZE));
			}
			datachannel.send(END_OF_FILE_MESSAGE);
			}
			}
			reader.readAsArrayBuffer(file);
		});
	}

	
	function shareFile(metadata,buffer,progress_node){
		socket.emit("file-meta", {
			uid:receiverID,
			metadata:metadata
		});
		
		socket.on("fs-share",function(){
			let chunk = buffer.slice(0,metadata.buffer_size);
			buffer = buffer.slice(metadata.buffer_size,buffer.length);
			let progress = Math.trunc(((metadata.total_buffer_size - buffer.length) / metadata.total_buffer_size * 100)) + " %";
			if(progress != "100 %") progress_node.innerText = "Progress : "+progress;
			else progress_node.innerText = "File Ready to Share!"
			if(chunk.length != 0){
				socket.emit("file-raw", {
					uid:receiverID,
					buffer:chunk
				});
			} else {
				console.log("Sent file successfully");
			}
		});
	}
})();