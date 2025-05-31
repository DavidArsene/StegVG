import Method from './interface.js'

const EOM = '01'
// Keeps the codes in the two-digit range
const NORMALIZER = 0x1D // not quite 0x20 to leave space for EOM

class MethodASCII extends Method {
	chars = [ 0 ]

	constructor(message = '') {
		super()

		this.chars = message.split('').map(char => {
			const charCode = char.charCodeAt(0)

			if (charCode < 0x20 || charCode >= 0x7F) {
				alert('Message contains non-ASCII characters')
				throw new Error('Message contains non-ASCII characters')
			}
			return charCode - NORMALIZER
		})
	}

	encodeCoord(coord = '') {
		if (this.chars === null) {
			return coord
		}

		if (!coord.includes('.')) coord += '.'
		const code = this.chars.shift()

		if (code === undefined) {
			this.chars = null // Mark as done
			return coord + EOM
		}

		return coord + (code < 10 ? '0' + code : code)
	}

	decodeCoord(coord = '') {
		const code = coord.slice(-2)
		if (code === EOM) return false

		const char = parseInt(code, 10)
		if (isNaN(char)) return false

		this.chars.push(char)
		return true
	}

	decodeResult() {
		return this.chars.map(code => String.fromCharCode(code + NORMALIZER)).join('')
	}
}

export default MethodASCII
