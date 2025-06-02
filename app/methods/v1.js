import Method from './interface.js'

export default class MethodV1 extends Method {
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

		alert('V1 can run out of space depending on SVG length, use other methods or check if decoding works.')
	}

	encodeNext() {
		const bit = (this.bits)[this.state++] ?? '2' // == '1' ? 1 : 0

		if (bit === '2' && !this.padded) return null

		return this.precision + bit
	}

	decodeNext(coord = '') {
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
