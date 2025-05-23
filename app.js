import { highlightElement } from 'https://unpkg.com/@speed-highlight/core/dist/index.js'


const fileInput = document.getElementById('file-input')
const choose = document.getElementById('choose')
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
	if (value.length && reader.result) {
		primaryButton.removeAttribute('disabled')
		primaryButton.children[1].textContent = 'Encode'
	} else {
		primaryButton.children[1].textContent = 'Decode'
	}
})

function EncodeMain(message) {

	let bits = ''
	for (let i = 0; i < message.length; i++) {
		const n = message.charCodeAt(i)
		bits += n.toString(2).padStart(8, '0')
	}

	// TODO: data validation
	const paths = document.querySelectorAll('#output>svg path')
	let i = 0
	for (const path of paths) {

		let d = path.getAttribute('d')
		d = d.replaceAll(/[0-9]+\.?[0-9]*/g, (num, _) => {
			// const n = parseFloat(num)
			const dot = num.includes('.') ? '' : '.'
			const prec = '000'
			const bit = bits[i++] ?? '2' // == '1' ? 1 : 0

			if (bit === '2' && meth.value === 'v1') return num

			return num + dot + prec + bit
		})

		path.setAttribute('d', d)
	}
	if (i < bits.length) {
		alert('Message too long for V1 and V2, choose a more complex SVG!')
		Render(reader.result.toString())
		throw new Error('Message too long')
	}
	payload.value = ''
	Render(output.innerHTML)
}

function DecodeMain() {
	const paths = document.querySelectorAll('#output>svg path')
	let digits = ''
	outer: for (const path of paths) {
		let d = path.getAttribute('d')

		// TODO: custom precision
		const our = d.match(/[0-9]+\.[0-9]*000[012]/g)
		if (!our) continue
		for (const o of our) {
			const bit = o.slice(-1)
			if (bit === '2') { break outer }
			digits += bit
		}
	}

	let result = ''
	for (let i = 0; i < digits.length; i += 8) {
		const byte = digits.slice(i, i + 8)
		if (byte.length < 8) break
		const n = parseInt(byte, 2)
		result += String.fromCharCode(n)
	}

	payload.value = result
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
