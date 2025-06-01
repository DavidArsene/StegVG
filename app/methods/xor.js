import Method from './interface.js'

// TODO: use first coord as EOM
// TODO: migrate to 001
const EOM = 999

class MethodXOR extends Method {
	message = [ 0 ]
	password = [ 0 ]
	position = 0

	/* private */
	constructor(message, password) {
		super()
		this.message = message
		this.password = password
	}

	static async newAsync(message = '', password = '') {

		const msg = message.split('').map(char => char.charCodeAt(0))
		const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
		const pwd = Array.from(new Uint8Array(digest))
		console.log('Hash:', pwd)

		return new MethodXOR(msg, pwd)
	}

	encodeCoord(coord = '') {
		if (this.position > this.message.length) {
			return coord
		} else if (this.position === this.message.length) {
			this.position++
			return coord + EOM
		}

		// Hash length is always 32
		const enc = this.message[this.position] ^ this.password[this.position++ % 32]

		if (!coord.includes('.')) coord += '.'
		if (enc < 10) console.warn('Single Digit:', enc, 'for', this.message[this.position - 1])
		return coord + (enc < 100 ? '0' + enc : enc)
	}

	decodeCoord(coord = '') {
		const code = parseInt(coord.slice(-3), 10)
		if (isNaN(code) || code === EOM) {
			return false
		}

		this.message.push(code ^ this.password[this.position++ % 32])
		return true

	}

	decodeResult() {
		return this.message.map(byte => String.fromCharCode(byte)).join('')
	}
}

export default MethodXOR
