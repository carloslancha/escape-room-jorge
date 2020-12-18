import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { ArrowLeftRight, CircleFill, PlayFill, SquareFill } from 'react-bootstrap-icons';

import {useRef, useState} from 'react';

import './App.css';

const codes = [
	{
		decodified: false,
		word: 'Patata',
	},
	{
		decodified: false,
		word: 'Platano',
	},
	{
		decodified: false,
		word: 'Egregio',
	},
];

function App() {
	const [isPlayingAudio, setIsPlayingAudio] = useState();
	const [isRecording, setIsRecording] = useState();
	const [logInError, setLogInError] = useState();
	const [mode, setMode] = useState();
	const [recordedAudio, setRecordedAudio] = useState();
	const [result, setResult] = useState();
	const [revertMode, setRevertMode] = useState();

	const mediaRecorderRef = useRef();

	const handleDecode = (event) => {
		event.preventDefault();

		const inputCode = event.target.input.value.toLowerCase();

		const result = codes.find((code) => {
			code = code.word.toLowerCase();

			if (code.length !== inputCode.length) {
				return false;
			}

			const splitedInputCode = inputCode.split('');

			for (let i=0; i < splitedInputCode.length; i++) {
				const inputCodeChar = splitedInputCode[i];

				const regExp = new RegExp(inputCodeChar, 'g');

				if (!code.match(regExp) || code.match(regExp).length !== inputCode.match(regExp).length) {
					return false;
				}
			}

			return true;
		});
		
		setResult(result ? result.word : 'No se han encontrado coincidencias');
	};

	const handleLogin = (event) => {
		event.preventDefault();

		const form = event.target;

		if (!revertMode && form.one.value === '1' && form.two.value === '2' && form.three.value === '3' && form.four.value === '4') {
			setMode(1);
		}
		else if (revertMode && form.one.value === '4' && form.two.value === '3' && form.three.value === '2' && form.four.value === '1') {
			setMode(2);
		}
		else {
			setLogInError('Contraseña incorrecta');
		}
	};

	const handleAudioRecord = () => {
		if (!isRecording) {
			setRecordedAudio();

			navigator.mediaDevices.getUserMedia({ audio: true })
				.then(stream => {
					const mediaRecorder = new MediaRecorder(stream);
					mediaRecorder.start();
					
					const audioChunks = [];

					mediaRecorder.addEventListener("dataavailable", event => {
						audioChunks.push(event.data);
					});

					mediaRecorder.addEventListener("stop", () => {
						const audioBlob = new Blob(audioChunks);
						const audioURL = URL.createObjectURL(audioBlob);
						setRecordedAudio(audioURL);
					});

					mediaRecorderRef.current = mediaRecorder;
				});
				
			setIsRecording(true);
		}
		else {
			const mediaRecorder = mediaRecorderRef.current;
			mediaRecorder.stop();
			setIsRecording(false);
		}
	};

	const handleAudioPlay = () => {
		if (recordedAudio && !isPlayingAudio) {
			var context = new (window.AudioContext || window.webkitAudioContext)();
			var audioSrc = recordedAudio;

			fetch(audioSrc, onSuccess);

			function fetch (url, resolve) {
				var request = new XMLHttpRequest();
				request.open('GET', url, true);
				request.responseType = 'arraybuffer';
				request.onload = function () { resolve(request) }
				request.send();
			}

			function onSuccess (request) {
				var audioData = request.response;
				context.decodeAudioData(audioData, onBuffer, onDecodeBufferError);
			}

			function onBuffer (buffer) {
				var source = context.createBufferSource();
				console.info('Got the buffer', buffer);

				for (let i=0; i < buffer.numberOfChannels; i++) {
					Array.prototype.reverse.call( buffer.getChannelData(i) );
				}

				source.buffer = buffer;
				source.onended = () => { setIsPlayingAudio(false) };
				source.connect(context.destination);
				source.start();
				setIsPlayingAudio(true);
			}

			function onDecodeBufferError (e) {
				console.log('Error decoding buffer: ' + e.message);
				console.log(e);
			}
		}
	}

	const handleRevert = () => {
		if (document.body.classList.contains('revert')) {
			document.body.classList.remove('revert');
		}
		else {
			document.body.classList.add('revert');
		}

		setRevertMode(!revertMode);
	}

	return (
		<>
			<Container className="py-5">
				{!mode && (
					<Row className="justify-content-md-center">
						<Col xs={12} sm={4} md={4} className="text-center">
							<h2>Introduce la contraseña</h2>
							<Form autoComplete="off" onChange={() => setLogInError(false)} onSubmit={handleLogin}>
								<Form.Row>
									<Form.Group as={Col}>
										<Form.Control className="text-center" name="one" type="text" maxLength="1" />
									</Form.Group>

									<Form.Group as={Col}>
										<Form.Control className="text-center" name="two" type="text" maxLength="1" />
									</Form.Group>

									<Form.Group as={Col}>
										<Form.Control className="text-center" name="three" type="text" maxLength="1" />
									</Form.Group>

									<Form.Group as={Col}>
										<Form.Control className="text-center" name="four" type="text" maxLength="1" />
									</Form.Group>
								</Form.Row>

								<p className="text-danger">
									{logInError}
								</p>

								<Button variant="primary" type="submit">
									Entrar
								</Button>
							</Form>
						</Col>
					</Row>
				)}

				{mode === 1 && (
					<Row className="justify-content-md-center">
						<Col xs={12} sm={4} md={4} className="text-center">
							<h2>Decodificador xPress</h2>
							<Form autoComplete="off" onSubmit={handleDecode}>
								<Form.Row>
									<Form.Group as={Col}>
										<Form.Control className="text-center" name="input" type="text" />
									</Form.Group>
								</Form.Row>

								<p>
									{result}
								</p>

								<Button variant="primary" type="submit">
									Decodificar
								</Button>
							</Form>
						</Col>
					</Row>
				)}

				{mode === 2 && (
					<Row className="justify-content-md-center">
						<Col xs={1} className="text-center">
							{!isRecording ? (
								<Button variant="danger" onClick={handleAudioRecord}>
									<CircleFill />
								</Button>
								) : (
								<Button variant="danger" onClick={handleAudioRecord}>
									<SquareFill />
								</Button>
							)}
						</Col>

						<Col xs={1} className="text-center">
							<Button variant={recordedAudio && !isPlayingAudio ? "success" : "secondary"} onClick={handleAudioPlay}>
								<PlayFill />
							</Button>
						</Col>
					</Row>
				)}
			</Container>

			<Button className="revert-button" variant="secondary" size="sm" onClick={handleRevert}>
				<ArrowLeftRight />
			</Button>
		</>
	);
}

export default App;
