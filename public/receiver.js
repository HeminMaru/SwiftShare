(function(){

	let socket = io();
	let sender_uid;

	var isChannelReady = false;
	var isStarted = false;
	var myPeerConnection;
	var turnReady;
	var datachannel;
	var filename;

	function generateID(){
		return `${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}`;
	}

	document.querySelector("#receiver-start-con-btn").addEventListener("click",function(){
		sender_uid = document.querySelector("#join-id").value;
		if(sender_uid.length == 0){
			return;
		}
		let joinID = generateID();
		socket.emit("receiver-join", {
			sender_uid:sender_uid,
			uid:joinID
		});
		isChannelReady = true;
		// console.log("reciever joined");
		// maybeStart();
		
		document.querySelector(".join-screen").classList.remove("active");
		document.querySelector(".fs-screen").classList.add("active");
	});

	let fileShare = {};

	socket.on('offer',async function(message){
		console.log("offer recieved")
		if (!isStarted) {
			maybeStart();
		}
		await myPeerConnection.setRemoteDescription(new RTCSessionDescription(message));
		doAnswer();
	});
	// socket.on('answer',function(message) {
	//   if(isStarted){
	// 	myPeerConnection.setRemoteDescription(new RTCSessionDescription(message))
	//   }
	// }); 
	socket.on('candidate', function(message){
		console.log("hereeeeeeeee")
		var candidate = new RTCIceCandidate({
			sdpMLineIndex: message.label,
			candidate: message.candidate
		  });
		  myPeerConnection.addIceCandidate(candidate);
	});
	
	const iceServers = [{"urls":"stun:stun.relay.metered.ca:80"},{"urls":"turn:a.relay.metered.ca:80","username":"124310a1bbd25d1ed27c1112","credential":"iFgghItekDQWISJO"},{"urls":"turn:a.relay.metered.ca:80?transport=tcp","username":"124310a1bbd25d1ed27c1112","credential":"iFgghItekDQWISJO"},{"urls":"turn:a.relay.metered.ca:443","username":"124310a1bbd25d1ed27c1112","credential":"iFgghItekDQWISJO"},{"urls":"turn:a.relay.metered.ca:443?transport=tcp","username":"124310a1bbd25d1ed27c1112","credential":"iFgghItekDQWISJO"}]

	function maybeStart() {
		console.log("started")
		if (!isStarted && isChannelReady) {
			// Creating peer connection 
			myPeerConnection = new RTCPeerConnection({
				iceServers: iceServers
			});
			myPeerConnection.onicecandidate = handleIceCandidate;			
			isStarted = true;
			//myPeerConnection.createOffer(setLocalAndSendMessage, handleCreateOfferError);
			//after_datachannel()
		}
		myPeerConnection.ondatachannel = function (event) {
			datachannel = event.channel;
			console.log(datachannel);
			datachannel.onopen = function (event) {
				console.log("data channel open!")
				datachannel.send('ANSWEREROPEN');
			}
			const receivedBuffers = [];
			datachannel.onmessage = async (event) => {
				console.log("The Answerrer received a message"+event.data);
				const { data } = event;
				try {
					if (data.isView(new Int32Array())){
						receivedBuffers.push(data);
					}
					else if(data === END_OF_FILE_MESSAGE) {
						const arrayBuffer = receivedBuffers.reduce((acc, arrayBuffer) => {
							const tmp = new Uint8Array(acc.byteLength + arrayBuffer.byteLength);
							tmp.set(new Uint8Array(acc), 0);
							tmp.set(new Uint8Array(arrayBuffer), acc.byteLength);
							return tmp;
						}, new Uint8Array());
						const blob = new Blob([arrayBuffer]);
						datachannel.send("THE FILE IS READYYY");
						// document.querySelector("#file-input").addEventListener('click',downloadFile(blob, channel.label);
						downloadFile(blob, filename);
						datachannel.close();
					}else {
						var filename = data;
					}
				} catch (err) {
					console.log('File transfer failed');
				}
			};
		};
	}

	function handleIceCandidate(event) {
		console.log('icecandidate event: ', event);
		if (event.candidate) {
			socket.emit('candidate',{
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
	async function doAnswer() {
		console.log('Sending answer to peer.');
		var answer = myPeerConnection.createAnswer();
		await myPeerConnection.setLocalDescription(answer);
		console.log(myPeerConnection.localDescription)
		socket.emit('transfer_ANS',{
			sender_uid : sender_uid,
			ans : answer 
		});
		console.log(myPeerConnection);
	}

	//Function to set description of local media
	async function setLocalAndSendMessage(answer) {
		await myPeerConnection.setLocalDescription(answer);
		console.log("xyznxkjdcnskldjcnl :",myPeerConnection.localDescription);
		console.log("Reciever Answer print : ",answer);
		socket.emit('transfer_ANS',{
			sender_uid : sender_uid,
			ans : answer 
		});
		socket.emit("transfer_sender_candidate",{
			sender_uid : sender_uid,
			label : null,
			candidate: answer
		});
		console.log(myPeerConnection);
	}

	function onCreateSessionDescriptionError(error) {
		trace('Failed to create session description: ' + error.toString());
	}

})();