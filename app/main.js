const fileInput = document.getElementById('file')
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
	renderMain(text)
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
	primaryButton.removeAttribute('disabled')
})

const reader = new FileReader()
reader.onload = () => initRender(reader.result.toString())


function renderMain(txt) {
	// SAFETY: Assume user is semi-competent
	const result = txt.trim()
	output.innerHTML = result
	code.textContent = result
	output.firstElementChild.removeAttribute('class')
	output.firstElementChild.removeAttribute('id')

	delete code.dataset.highlighted
	// noinspection JSUnresolvedVariable
	hljs.highlightElement(code)
}

fileInput.onchange = e => {
	const file = e.target.files[0]
	if (!file) {
		return primaryButton.setAttribute('disabled', '')
	}
	choose.children[2].innerText = file.name
	primaryButton.removeAttribute('disabled')
	downloadButton.setAttribute('disabled', '')
	example.remove()

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
	// TODO: ugly
	if (e.target.value.length && output.children[0].tagName === 'svg') {
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
			const v1 = (await import('./methods/v1.js')).default
			method = val => new v1(val, meth.value === 'v1')
			break
		case 'ascii':
			const ascii = (await import('./methods/ascii.js')).default
			method = val => new ascii(val)
			break
		case 'xor':
			const xor = (await import('./methods/xor.js')).default
			// await coloring caused by crypto.subtle :/
			method = async val => await xor.initXor(val, key.value)
			break
		case 'aes':
			const aes = (await import('./methods/aes.js')).default
			method = async val => await aes.initAes(val, key.value)
			break
		default:
			throw new Error('Method not implemented!')
	}

	if (payload.value.length && !forceDecodeMode) {
		encodeMain(await method(payload.value))
		downloadButton.removeAttribute('disabled')
		primaryButton.children[1].textContent = 'Decode'
	} else {
		await decodeMain(await method())
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
	}, 10000)
})


function encodeMain(encoder) {
	const paths = document.querySelectorAll('#output>svg path')
	let progress = 0

	// TODO: data validation
	for (const path of paths) {
		let d = path.getAttribute('d')

		d = d.replaceAll(/[0-9]+\.?[0-9]*/g, (num, _) => {
			// Maybe zeros should be left alone
			if (num === '0') return num // No reasonable regex yet

			// const n = parseFloat(num)
			progress++

			const answer = encoder.encodeNext()
			if (!answer) return num

			// add 0 to ensure invisible changes
			if (!num.includes('.')) num += '.0'

			return num + answer
		})

		path.setAttribute('d', d)
	}

	if (payload.value.length > progress) {
		renderMain(currentTextForReload)
		return alert(`SVG too short, used ${ payload.value.length } out of ${ progress } available bytes.`)
	}

	payload.value = ''
	renderMain(output.innerHTML)
}

async function decodeMain(decoder) {
	const paths = document.querySelectorAll('#output>svg path')

	outer: for (const path of paths) {
		const d = path.getAttribute('d')

		for (const num of d.match(/[0-9]+\.[0-9]{2,}/g)) {
			if (num === '0') continue // Skip zeros

			if (!decoder.decodeNext(num)) break outer
		}
	}

	payload.value = await decoder.decodeResult()
}

function lorem() {
	payload.value = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
		+ ' Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
		+ ' Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
		+ ' Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
	key.value = 'Lorem ipsum dolor sit amet'
}
