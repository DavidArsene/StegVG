import Method from './interface.js'

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
			return charCode
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
			return coord + '137' // end of message
		}

		return coord + (code < 100 ? '0' + code : code)
	}

	decodeCoord(coord = '') {
		const code = parseInt(coord.slice(-3), 10)

		if (isNaN(code) || code === 137) return false
		this.chars += code
		return true
	}

	decodeResult() {
		return this.chars.map(code => String.fromCharCode(code)).join('')
	}
}

export default MethodASCII
