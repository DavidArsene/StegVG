import { highlightElement } from 'https://unpkg.com/@speed-highlight/core/dist/index.js'


const fileInput = document.getElementById('file-input')
const choose = document.getElementById('choose')
const example = document.getElementById('example')
const payload = document.getElementById('payload')
const key = document.getElementById('key')
const meth = document.getElementById('method')
const primaryButton = document.getElementById('btn-start')
const downloadButton = document.getElementById('btn-download')
const output = document.getElementById('output')
const code = document.getElementById('code')

choose.addEventListener('click', _ => {
	fileInput.click()
})

const demos = [
	'dog',
	'Heckert_GNU',
	'Invertocat',
	'short',
	'Survivorship-bias',
]

example.addEventListener('click', _ => {
	const randomIndex = Math.floor(Math.random() * demos.length)
	const demoFile = `preload/${ demos[randomIndex] }.svg`
	fetch(demoFile)
		.then(response => response.text())
		.then(text => {
			Render(text)
			fileInput.value = ''
			payload.value = ''
			primaryButton.removeAttribute('disabled')
			downloadButton.setAttribute('disabled', null)
		})
		.catch(err => console.error('Error loading example:', err))
})

const reader = new FileReader()
reader.onload = () => Render(reader.result.toString())


function Render(txt) {
	// SAFETY: Assume user is semi-competent
	const result = txt.trim()
	output.innerHTML = result
	code.textContent = result
	output.firstElementChild.removeAttribute('class')
	output.firstElementChild.removeAttribute('id')

	// TODO: Word wrap for paths
	highlightElement(code)
}

fileInput.onchange = e => {
	const file = e.target.files[0]
	if (!file) {
		return primaryButton.setAttribute('disabled', null)
	}
	choose.children[2].innerText = file.name
	primaryButton.removeAttribute('disabled')
	downloadButton.setAttribute('disabled', null)
	payload.value = ''

	reader.readAsText(file)
}

payload.addEventListener('input', e => {
	const value = e.target.value
	if (value.length && output.children[0].tagName === 'svg') {
		primaryButton.removeAttribute('disabled')
		primaryButton.children[1].textContent = 'Encode'
	} else {
		primaryButton.children[1].textContent = 'Decode'
	}
})

meth.addEventListener('change', e => {
	switch (e.target.value) {
		case 'v1':
		case 'v2':
		case 'ascii':
			key.setAttribute('disabled', null)
			key.placeholder = 'Not supported for current method.'
			key.value = ''
			break
		case 'xor':
		case 'aes':
			key.removeAttribute('disabled')
			key.placeholder = 'This method requires a password.'
			break
		default:
			alert('Oops my bad')
	}
})

primaryButton.addEventListener('click', async _ => {
	let method
	switch (meth.value) {
		case 'v1':
		case 'v2':
			const MethodV1 = (await import('./methods/v1.js')).default
			method = new MethodV1(payload.value, meth.value === 'v1')
			break
		case 'ascii':
			const MethodASCII = (await import('./methods/ascii.js')).default
			method = new MethodASCII(payload.value)
			break
		default:
			throw new Error('Unknown method selected')
	}

	if (payload.value.length) {
		EncodeMain(method)
		downloadButton.removeAttribute('disabled')
		primaryButton.children[1].textContent = 'Decode'
	} else {
		DecodeMain(method)
		downloadButton.setAttribute('disabled', null)
		primaryButton.children[1].textContent = 'Encode'
	}
})

downloadButton.addEventListener('click', _ => {
	const blob = new Blob([ output.innerHTML ], { type: 'image/svg+xml' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = choose.children[2].innerText
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)

	// couldn't bother resetting state
	setTimeout(() => {
		location.reload()
	}, 5000)
})


function EncodeMain(encoder) {
	const paths = document.querySelectorAll('#output>svg path')

	// TODO: data validation
	for (const path of paths) {
		let d = path.getAttribute('d')

		d = d.replaceAll(/[0-9]+\.?[0-9]*/g, (num, _) => {
			// const n = parseFloat(num)
			return encoder.encodeCoord(num)
		})

		path.setAttribute('d', d)
	}

	payload.value = ''
	Render(output.innerHTML)
}

function DecodeMain(decoder) {
	const paths = document.querySelectorAll('#output>svg path')

	outer: for (const path of paths) {
		const d = path.getAttribute('d')

		for (const num of d.match(/[0-9]+\.[0-9]{2,}/g))
			if (!decoder.decodeCoord(num)) break outer
	}

	payload.value = decoder.decodeResult()
	primaryButton.setAttribute('disabled', null)
}
