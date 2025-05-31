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

let currentTextForReload = ''
let forceDecodeMode = false

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

function initRender(text = '') {
	Render(text)
	payload.dispatchEvent(new InputEvent('input'))
	currentTextForReload = text
	forceDecodeMode = false
	payload.removeAttribute('disabled')
}

example.addEventListener('click', _ => {
	const rand = Math.floor(Math.random() * demos.length)
	const demo = `preload/${ demos[rand] }.svg`
	fetch(demo)
		.then(response => response.text())
		.then(text => {
			initRender(text)
			fileInput.value = ''
		})
		.catch(err => console.error('Error loading example:', err))
})

const reader = new FileReader()
reader.onload = () => initRender(reader.result.toString())


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
		return primaryButton.setAttribute('disabled', '')
	}
	choose.children[2].innerText = file.name
	primaryButton.removeAttribute('disabled')
	downloadButton.setAttribute('disabled', '')

	reader.readAsText(file)
}

payload.addEventListener('input', e => {
	const value = e.target.value
	if (value.length && output.children[0].tagName === 'svg') {
		primaryButton.removeAttribute('disabled')
	}
	primaryButton.children[1].textContent = value.length ? 'Encode' : 'Decode'
})

function requirePwd(e) {
	if (e.target.value.length) {
		primaryButton.removeAttribute('disabled')
	} else {
		primaryButton.setAttribute('disabled', '')
	}
}

meth.addEventListener('change', e => {
	switch (e.target.value) {
		case 'v1':
		case 'v2':
		case 'ascii':
			key.setAttribute('disabled', '')
			key.placeholder = 'Not supported for current method.'
			key.value = ''
			key.removeEventListener('input', requirePwd)
			payload.dispatchEvent(new InputEvent('input'))
			break
		case 'xor':
		case 'aes':
			key.removeAttribute('disabled')
			key.placeholder = 'This method requires a password.'
			key.addEventListener('input', requirePwd)
			break
		default:
			alert('Oops my bad')
	}
	key.dispatchEvent(new InputEvent('input'))
})

primaryButton.addEventListener('click', async _ => {
	let method = () => { throw new Error() }
	switch (meth.value) {
		case 'v1':
		case 'v2':
			const MethodV1 = (await import('./methods/v1.js')).default
			method = val => new MethodV1(val, meth.value === 'v1')
			break
		case 'ascii':
			const MethodASCII = (await import('./methods/ascii.js')).default
			method = val => new MethodASCII(val)
			break
		case 'xor':
			const MethodXOR = (await import('./methods/xor.js')).default
			// await coloring caused by crypto.subtle :/
			method = async val => await MethodXOR.newAsync(val, key.value)
			break
		default:
			throw new Error('Method not implemented!')
	}

	if (payload.value.length && !forceDecodeMode) {
		EncodeMain(await method(payload.value))
		downloadButton.removeAttribute('disabled')
		primaryButton.children[1].textContent = 'Decode'
	} else {
		DecodeMain(await method())
		forceDecodeMode = true
		payload.setAttribute('disabled', '')
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
	let progress = 0

	// TODO: data validation
	for (const path of paths) {
		let d = path.getAttribute('d')

		d = d.replaceAll(/[0-9]+\.?[0-9]*/g, (num, _) => {
			// Maybe zeros should be left alone
			// if (num === '0') return num // No reasonable regex yet
			// TODO: bugged?

			// const n = parseFloat(num)
			progress++
			// TODO: unconditional 0 pad
			return encoder.encodeCoord(num)
		})

		path.setAttribute('d', d)
	}

	if (payload.value.length > progress) {
		Render(currentTextForReload)
		return alert(`SVG too short, used ${ progress } out of ${ payload.value.length }.`)
	}

	payload.value = ''
	Render(output.innerHTML)
}

function DecodeMain(decoder) {
	const paths = document.querySelectorAll('#output>svg path')

	outer: for (const path of paths) {
		const d = path.getAttribute('d')

		for (const num of d.match(/[0-9]+\.[0-9]{2,}/g)) {
			// if (num === '0') continue // Skip zeros

			if (!decoder.decodeCoord(num)) break outer
		}
	}

	payload.value = decoder.decodeResult()
}
