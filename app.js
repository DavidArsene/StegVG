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
	output.children[0].removeAttribute('width')
	output.children[0].removeAttribute('height')
	// output.children[0].removeAttribute('fill')

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


class Method {
	constructor() {
		if (new.target === Method) {
			throw new TypeError('Cannot construct Method instances directly')
		}
		this.name = 'base'
	}

	encodeCoord(coord) {
		return ''
	}

	decodeCoord() {
		return false
	}

	decodeResult() {
		return ''
	}
}


class MethodV1 extends Method {
	bits = ''
	padded = false
	precision = '000'
	state = 0

	constructor(message = '', padded = false) {
		super()
		this.padded = padded

		for (let i = 0; i < message.length; i++) {
			const n = message.charCodeAt(i)
			this.bits += n.toString(2).padStart(8, '0')
		}
	}

	encodeCoord(coord = '') {
		const dot = coord.includes('.') ? '' : '.'
		const bit = (this.bits)[this.state++] ?? '2' // == '1' ? 1 : 0

		if (bit === '2' && !this.padded) return coord

		return coord + dot + this.precision + bit
	}

	decodeCoord(coord = '') {
		if (!coord.endsWith(this.precision + '0') && !coord.endsWith(this.precision + '1')) return false

		const bit = coord.slice(-1)
		this.bits += bit
		return true
	}

	decodeResult() {
		let result = ''
		for (let i = 0; i < this.bits.length; i += 8) {
			const byte = this.bits.slice(i, i + 8)
			if (byte.length < 8) break
			const n = parseInt(byte, 2)
			result += String.fromCharCode(n)
		}
		return result
	}
}


function EncodeMain(message) {
	const paths = document.querySelectorAll('#output>svg path')
	const encoder = new MethodV1(message, meth.value === 'v1')

	// TODO: data validation
	for (const path of paths) {
		let d = path.getAttribute('d')

		d = d.replaceAll(/[0-9]+\.?[0-9]*/g, (num, _) => {
			// const n = parseFloat(num)
			return encoder.encodeCoord(num)
		})

		path.setAttribute('d', d)
	}
	if (encoder.state < encoder.bits.length) { // TODO: implementation detail
		alert('Message too long for V1 and V2, choose a more complex SVG!')
		Render(reader.result.toString())
		throw new Error('Message too long')
	}
	payload.value = ''
	Render(output.innerHTML)
}

function DecodeMain() {
	const paths = document.querySelectorAll('#output>svg path')
	const decoder = new MethodV1()

	outer: for (const path of paths) {
		const d = path.getAttribute('d')

		for (const num of d.match(/[0-9]+\.[0-9]{2,}/g))
			if (!decoder.decodeCoord(num)) break outer
	}

	payload.value = decoder.decodeResult()
	primaryButton.setAttribute('disabled', null)
}

primaryButton.addEventListener('click', _ => {
	if (payload.value.length) {
		EncodeMain(payload.value)
		downloadButton.removeAttribute('disabled')
	} else DecodeMain()
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
