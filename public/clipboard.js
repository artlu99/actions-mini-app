async function getClipboardContent() {
	const clipboardItems = await navigator.clipboard.read();
	let text = '';
	let clipboardDetails = '🔍 Clipboard Debug Information:\n\n';
	
	clipboardDetails += `Number of items: ${clipboardItems.length}\n\n`;
	
	// Try to find text/plain or text/uri-list content first
	for (let i = 0; i < clipboardItems.length; i++) {
		const item = clipboardItems[i];
		clipboardDetails += `Item ${i + 1}:\n`;
		clipboardDetails += `Types: ${item.types.join(', ')}\n`;
		
		// First pass: look for text/plain or text/uri-list
		for (const type of item.types) {
			if (type === 'text/plain' || type === 'text/uri-list') {
				try {
					const blob = await item.getType(type);
					const content = await blob.text();
					clipboardDetails += `\nType "${type}" content:\n${content}\n`;
					
					if (!text) {
						text = content;
						// If it's a URI list, take the first line
						if (type === 'text/uri-list') {
							text = text.split('\n')[0];
						}
					}
				} catch (err) {
					clipboardDetails += `\nError reading type "${type}": ${err.message}\n`;
				}
			}
		}
		
		// Second pass: show other types for debugging
		for (const type of item.types) {
			if (type !== 'text/plain' && type !== 'text/uri-list') {
				try {
					const blob = await item.getType(type);
					const content = await blob.text();
					clipboardDetails += `\nType "${type}" content:\n${content}\n`;
				} catch (err) {
					clipboardDetails += `\nError reading type "${type}": ${err.message}\n`;
				}
			}
		}
		clipboardDetails += '\n';
	}

	// If no text found, try the simpler readText method
	if (!text) {
		try {
			text = await navigator.clipboard.readText();
			clipboardDetails += `Simple readText() result: ${text}\n`;
		} catch (err) {
			clipboardDetails += `Error in readText(): ${err.message}\n`;
		}
	}

	return { text, clipboardDetails };
} 