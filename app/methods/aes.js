import Method from './interface.js'

const EOM = 999

export default class MethodAES extends Method {
	constructor(message = [], key = null) {
		super()
		this.message = message
		this.key = key
		this.iv = []
		this.readingIv = true
	}

	static async initAes(message = '', password = '') {
		if (password.length > 32) {
			throw new Error('Do not use passwords longer than 32 characters.')
		}
		password = password.padEnd(32)

		const key = await crypto.subtle.importKey(
			'raw',
			new TextEncoder().encode(password),
			{ name: 'AES-GCM' },
			false,
			[ 'encrypt', 'decrypt' ],
		)

		// Decoding mode
		if (!message) return new MethodAES([], key)

		const iv = crypto.getRandomValues(new Uint8Array(12))
		const encryptedData = await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv },
			key,
			new TextEncoder().encode(message),
		)
		message = [
			...Array.from(iv),
			EOM,
			...Array.from(new Uint8Array(encryptedData)),
			EOM,
		]

		console.log('Final required bytes:', message.length)

		return new MethodAES(message, key)
	}

	encodeNext() {
		if (!this.message.length) {
			return null
		}
		return this.message.shift().toString().padStart(3, '0')
	}

	decodeNext(coord = '') {
		const data = parseInt(coord.slice(-3), 10)

		if (data === EOM) {
			if (this.readingIv) {
				this.readingIv = false
				return true
			}
			return false
		}

		if (isNaN(data)) {
			throw new Error('What')
		}
		(this.readingIv ? this.iv : this.message).push(data)
		return true
	}

	async decodeResult() {
		const iv = new Uint8Array(this.iv)
		const encrypted = new Uint8Array(this.message)

		const bytes = await crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv },
			this.key,
			encrypted,
		)
		return new TextDecoder().decode(bytes)
	}
}
