// let currentRand = Math.random() * (2 << 31)

function generateRandomBinary(length) {
	const result = []
	const chars = '01'

	for (let i = 0; i < length; i++) {
		result.push(chars.charAt(Math.floor(Math.random() * 2)))
	}

	return result
}

const canvas = document.getElementById('matrix')
const ctx = canvas.getContext('2d')

onresize = () => {
	const { width, height } = canvas.getBoundingClientRect()
	const dpr = devicePixelRatio
	canvas.width = width * dpr
	canvas.height = height * dpr
	ctx.scale(dpr, dpr)
}
onresize(undefined)

const particles = Array.from({ length: 500 }, () => ({
	x: Math.random() * canvas.width,
	y: Math.random() * canvas.height,
	size: Math.random() * 2 + 0.5,
	speedX: (Math.random() - 0.5) * 0.3,
	speedY: (Math.random() - 0.5) * 0.3,
	opacity: Math.random() * 0.5 + 0.1,
}))

const minLength = 5
const maxLength = 30

function createString() {
	const len = Math.floor(Math.random() * maxLength) + minLength
	return {
		x: Math.random() * canvas.width,
		y: -len * 14,
		length: len,
		speed: Math.random() + 1,
		chars: generateRandomBinary(len),
		opacity: Math.random() * 0.4 + 0.1,
	}
}

const binaryStrings = Array.from({ length: 75 }, () => {
	let str = createString()
	str.y = Math.random() * canvas.height
	return str
})

let animationFrameId
let hexSeed = Math.floor(Math.random() * 1_000_000_000)
console.log(hexSeed)

function render() {
	const { width, height } = canvas.getBoundingClientRect()

	const gradient = ctx.createLinearGradient(0, 0, width, height)
	gradient.addColorStop(0, '#0A0F18')
	gradient.addColorStop(1, '#121A2A')
	ctx.fillStyle = gradient
	ctx.fillRect(0, 0, width, height)

	for (const particle of particles) {
		particle.x += particle.speedX
		particle.y += particle.speedY

		if (particle.x < 0) particle.x = width
		if (particle.x > width) particle.x = 0
		if (particle.y < 0) particle.y = height
		if (particle.y > height) particle.y = 0

		ctx.beginPath()
		ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
		ctx.fillStyle = `rgba(138, 180, 248, ${ particle.opacity })`
		ctx.fill()
	}

	for (let i = 0; i < binaryStrings.length; i++) {
		let string = binaryStrings[i]
		string.y += string.speed
		if (string.y > height) {
			binaryStrings[i] = createString()
		}

		ctx.font = '12px monospace'
		ctx.fillStyle = `rgba(102, 204, 170, ${ string.opacity })`

		for (let i = 0; i < string.chars.length; i++) {
			ctx.fillText(string.chars[i], string.x, string.y + i * 14)
		}
	}

	ctx.strokeStyle = 'rgba(64, 190, 255, 0.03)'
	const hexSize = 60
	const hexHeight = hexSize * Math.sqrt(3)
	const hexCols = Math.ceil(width / (hexSize * 1.5)) + 1
	const hexRows = Math.ceil(height / hexHeight) + 1

	for (let row = 0; row < hexRows; row++) {
		for (let col = 0; col < hexCols; col++) {

			const x = col * hexSize * 1.5
			const y = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2)

			// const skip = hexSeed % (row * hexCols + col)
			// console.log(hexSeed, row, col, skip)
			// if (skip === 0) continue

			ctx.beginPath()
			for (let i = 0; i < 6; i++) {
				const angle = (Math.PI / 3) * i
				const hx = x + hexSize * Math.cos(angle)
				const hy = y + hexSize * Math.sin(angle)

				i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy)
			}
			ctx.closePath()
			// ctx.fillStyle = `rgba(64, 190, 255)`
			ctx.stroke()
		}
	}

	animationFrameId = requestAnimationFrame(render)
}

render()
// onblur = () => cancelAnimationFrame(animationFrameId)
// onfocus = () => animationFrameId = requestAnimationFrame(render)
