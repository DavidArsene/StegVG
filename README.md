# Stegable Vector Graphics

Proof of concept for a largely unknown steganography technique that uses SVG files to hide data.

Current methods use path elements by making small precision changes to points.

Example: `M100,10 L20` -> `M100.0001,10.0000 L20.0001` -> encoded b101
