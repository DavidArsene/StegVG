# Stegable Vector Graphics
---

(More than just) A proof of concept for a largely unknown steganography technique of using SVG files to hide data.

All methods implemented here make small precision changes to coordinates in <path> elements,
resulting in imperceptible changes to the image:

## V1

The first method I thought of was to split the message into bits and append them to each coordinate,
along with an extra '00' to ensure the change is invisible.

Example: `M100,10 L20` -> `M100.001,10.000 L20.001` -> encoded `b101`

This method has some immediate drawbacks, namely the fact that the 00s are very suspicious,
and that using just one bit per coordinate is wasteful when we could use charCodes instead.

## ASCII

Surprisingly, the next method I implemented does just that: splits the message into charCodes and
appends them to the coordinates. Decoding just does the reverse. Currently, only regular ASCII characters are supported
(to keep added length to 2 digits), but could definitely be extended.

### Example:

- Input file: `M 10 100 Q 25 10 180 100 T 250 100 T 320 100 T 390 100`
- Encoded: `M 10.075 100.072 Q 25.079 10.079 180.082 100.003 T 250.090 100.082 T 320.085 100.079 T 390.071 100.001`
- Decoded: `hello world`

Note that integer coordinates are given an extra '0', to ensure that the change is invisible.

## XOR and AES

What is steganography without cryptography? No matter how well a message is hidden, if it can be read it will be read.
The las two methods use XOR and AES to encrypt the message with a key before encoding it.
The key is required for decryption.

The XOR method hashes the key, otherwise it would be vulnerable to password guessing.
The AES method outputs an encrypted message that includes the IV and the encrypted message itself,
and as such can require more space (longer SVG).

## Credits

- [MDN](https://developer.mozilla.org/en-US/docs) for their wonderful documentation.
- [Wikipedia](https://en.wikipedia.org/wiki) for the public domain images used in examples.
- [Google](https://google.com/search?q=why+click+this%2C+do+you+not+know+what+google+is%3F) for confirming the relative
  obscurity* of this idea.
- [JetBrains](https://jetbrains.com) for their IDEs with their well deserved reputation.

*Except for: one GitHub repo from 15 years ago, a Reddit and HN post, and a few papers,
one of which incredibly was published while I was making this.
